from django.shortcuts import get_object_or_404
from django.db.models import Count, Q, Value
from django.db.models.functions import Concat

from ninja.pagination import paginate, PageNumberPagination
from ninja import NinjaAPI, Query

from django.http import JsonResponse
from django.contrib.auth import authenticate, login, logout
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.views.decorators.csrf import ensure_csrf_cookie
from django.contrib.auth.password_validation import validate_password

from django.utils import timezone

from movies.models import Movie, Genre, Person, OscarWinsMovie, OscarWinsPerson, MoviesActors, MoviesDirectors
from movies.models import User, Comments, Ratings, MovieList, MovieListMovies

from movies.schemas import (MovieListSchema, GenreSchema, PersonSchema, OscarWinsMovieSchema, OscarWinsPersonSchema,
                            ActorSchemaForMovies, DirectorSchemaForMovies, MoviePageSchema, ActorFilmographySchema,
                            CommentMovieSchema, CommentCreateSchema, CommentEditSchema,
                            RatingCreateSchema, RatingEditSchema, RatingMovieSchema,
                            RecommendedMoviesSchema, PredictedMoviesSchema, ListedMoviesSchema, ListCreateSchema,
                            ListUpdateSchema, AddMovieToList, MovieListsSchema, MovieInList, PersonSchemaForMovies)

from movies.schemas import UserOut, LoginIn, Register, ProfileInfo, EditProfileInfo

from collections import OrderedDict
from sklearn.neighbors import NearestNeighbors
from django_pandas.io import read_frame
from django.db.models import Prefetch
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import pandas as pd

from ninja.security import django_auth

app = NinjaAPI(csrf=True)


@app.get("/movies", response=list[MovieListSchema], )
@paginate(PageNumberPagination, page_size=8)
def get_movies(request):
    return Movie.objects.annotate(num_oscar_wins=Count('oscar_wins')).order_by('-num_oscar_wins', '-release_year')


@app.get("/movies/{movie_id}", response=MoviePageSchema)
def get_movie(request, movie_id):
    movie = get_object_or_404(Movie, id=movie_id)

    oscar_wins = OscarWinsMovie.objects.filter(movie_id=movie_id).values('id', 'category__name', 'year', 'ceremony', 'movie')

    movies_with_actors = MoviesActors.objects.filter(movie_id=movie_id).values('actor__id', 'actor__first_name', 'actor__last_name', 'character')

    movies_with_directors = MoviesDirectors.objects.filter(movie_id=movie_id).values('director__id', 'director__first_name', 'director__last_name')

    actor_oscar_win = OscarWinsPerson.objects.filter(movie=movie_id).values('person__id', 'person__first_name', 'person__last_name', 'category__name')

    movie_oscar_wins_data = [
        OscarWinsMovieSchema(
            id=win['id'],
            category=win['category__name'],
            year=win['year'],
            ceremony=win['ceremony'],
            person=next((
                PersonSchemaForMovies(
                    id=p['person__id'],
                    first_name=p['person__first_name'],
                    last_name=p['person__last_name']
                )
                for p in actor_oscar_win if p['category__name'] == win['category__name']), None)
        )
        for win in oscar_wins
    ]

    movies_with_actors_data = [
        ActorSchemaForMovies(
            id=actor['actor__id'], 
            first_name=actor['actor__first_name'], 
            last_name=actor['actor__last_name'], 
            character=actor['character'])
        for actor in movies_with_actors 
    ]

    movies_with_directors_data = [
        DirectorSchemaForMovies(
            id=director['director__id'], 
            first_name=director['director__first_name'], 
            last_name=director['director__last_name'])
        for director in movies_with_directors   
    ]

    return MoviePageSchema(
        id=movie.id,
        release_year=movie.release_year,
        title=movie.title,
        tagline=movie.tagline,
        runtime=movie.runtime,
        budget=movie.budget,
        revenue=movie.revenue,
        overview=movie.overview,
        genres=movie.genres,
        actors=movies_with_actors_data,
        directors=movies_with_directors_data,
        movie_oscar_wins=movie_oscar_wins_data,
    )


@app.get("/genres", response=list[GenreSchema])
def get_genres(request):
    return Genre.objects.all()


@app.get("/genres/{genre_id}", response=GenreSchema)
def get_genre(request, genre_id):
    return get_object_or_404(Genre, id=genre_id)


@app.get("/people", response=list[PersonSchema])
def get_people(request):
    return Person.objects.all()


@app.get("/people/{person_id}", response=PersonSchema)
def get_person(request, person_id):
    person = get_object_or_404(Person, id=person_id)
    
    oscar_wins = OscarWinsPerson.objects.filter(person_id=person_id).values('id', 'movie', 'movie__title', 'category__name', 'year', 'ceremony').order_by('year')

    person_acted = MoviesActors.objects.filter(actor=person_id).values('movie__id', 'movie__title', 'movie__release_year')

    person_directed = MoviesDirectors.objects.filter(director=person_id).values('movie__id', 'movie__title', 'movie__release_year')

    person_filmography = person_acted.union(person_directed, all=False).order_by('-movie__release_year')

    oscar_wins_data = [
        OscarWinsPersonSchema(
            id=win['id'], 
            movie_id=win['movie'], 
            movie_title=win['movie__title'], 
            category=win['category__name'], 
            year=win['year'], 
            ceremony=win['ceremony'])
        for win in oscar_wins
    ]

    person_filmography_data = [
        ActorFilmographySchema(
            id=movie['movie__id'], 
            title=movie['movie__title'],
            release_year=movie['movie__release_year']
        ) for movie in person_filmography 
    ]

    return PersonSchema(
        id=person.id,
        first_name=person.first_name,
        last_name=person.last_name,
        birthday=person.birthday,
        place_of_birth=person.place_of_birth,
        biography=person.biography,
        filmography=person_filmography_data,
        oscar_wins=oscar_wins_data
    )


@app.get("/oscar_wins", response=list[OscarWinsMovieSchema])
def get_oscar_wins(request):
    return OscarWinsMovie.objects.all()


@app.get("/search", response=list[MovieListSchema])
@paginate(PageNumberPagination, page_size=8)
def search_movies_dist(request, query: str = Query(None), 
                       genre: list[int] = Query(None),
                       start_year: str = Query(None),
                       end_year: str = Query(None),
                       runtime_min: str = Query(None),
                       runtime_max: str = Query(None)):
    
    queryset = Movie.objects.annotate(
        actor_name=Concat('actors__first_name', Value(' '), 'actors__last_name'),
        director_name=Concat('directors__first_name', Value(' '), 'directors__last_name'),
        num_oscar_wins=Count('oscar_wins')
    ).order_by('-num_oscar_wins', '-release_year')

    result = queryset.filter(Q(title__icontains=query) | 
                                Q(actor_name__icontains=query) | 
                                Q(director_name__icontains=query))

    if start_year:
        result = result.filter(release_year__gte=start_year)
        
    if end_year:
        result = result.filter(release_year__lte=end_year)

    if genre:
        for genre_id in genre:
            result = result.filter(genres__id=genre_id)

    if runtime_min:
        result = result.filter(runtime__gte=runtime_min)

    if runtime_max:
        result = result.filter(runtime__lte=runtime_max)

    result = list(OrderedDict.fromkeys(result))

    return result


@app.get("/me", response=UserOut)
def get_me(request):
    if request.user.is_authenticated:
        user_data = {
            "id": request.user.id,
            "username": request.user.username
        }
        return user_data
    else:
        return JsonResponse({"error": "Need to login"}, status=401)
    

@app.post("/login", response=UserOut, auth=None)
def login_user(request, data: LoginIn):
    username = data.username
    password = data.password

    user = authenticate(request, username=username, password=password)

    if user is not None:
        login(request, user)
        user_data = {
            "id": user.id,
            "username": user.username,
        }

        return JsonResponse(user_data)
    else:
        return JsonResponse({"error": "Incorrect username or password"}, status=401)

    
@app.post("/logout", response=str)
def logout_user(request):
    logout(request)
    return "Logged out successfully"


@app.post("/register", response=UserOut, auth=None)
def register_user(request, data: Register):

    try:
        validate_email(data.email)
    except ValidationError:
        return JsonResponse({"error": "Invalid email address"}, status=400)
        
    if User.objects.filter(email=data.email).exists():
        return JsonResponse({"error": "Email already exists"}, status=409)

    if User.objects.filter(username=data.username).exists():
        return JsonResponse({"error": "Username already exists"}, status=409)
    
    try:
        validate_password(data.password)
    except ValidationError as error:
        return JsonResponse({"error": "\n".join(error.messages)}, status=400)

    user = User.objects.create_user(
        email=data.email,
        username=data.username,
        password=data.password
    )

    user.save()

    return UserOut(id=user.id, username=user.username, email=user.email)


@app.get("/set-cookie", auth=None)
@ensure_csrf_cookie
def set_cookie(request):
    return JsonResponse({"details": "CSRF cookie set"})


@app.get("/profile/{user_id}", response=ProfileInfo, auth=None)
def get_profile_data(request, user_id):
    try:
        user = get_object_or_404(User, id=user_id)
    except User.DoesNotExist:
        user = None

    local_timezone = timezone.get_current_timezone()
    localized_date_joined = user.date_joined.astimezone(local_timezone)
    
    return ProfileInfo(
        id=user.id,
        username=user.username,
        first_name=user.first_name,
        last_name=user.last_name,
        profile_picture=user.profile_picture if user and user.profile_picture else "",
        date_joined=localized_date_joined.strftime("%Y-%m-%d %H:%M:%S"),
        bio=user.bio if user and user.bio else "",
    )


@app.put("/profile/{user_id}", auth=django_auth)
def edit_profile_data(request, user_id, data: EditProfileInfo):
    user = User.objects.get(id=user_id)

    if data.first_name:
        user.first_name = data.first_name
    if data.last_name:
        user.last_name = data.last_name

    if data.new_password:
        if not user.check_password(data.current_password):
            return JsonResponse({"error": "Existing password is incorrect."}, status=400)

        if data.new_password != data.new_password_repeat:
            return JsonResponse({"error": "Passwords do not match."}, status=400)
        
        if not data.current_password:
            return JsonResponse({"error": "Please provide your current password."}, status=400)
            
        try:
            validate_password(data.new_password)
        except ValidationError as error:
            return JsonResponse({"error": "\n".join(error.messages)}, status=400)

        user.set_password(data.new_password)

    elif data.new_password_repeat:
        return JsonResponse({"error": "Please provide both new password and current password."}, status=400)
    
    if data.bio:
        user.bio = data.bio
    
    user.save()
        
    return JsonResponse({"success": "Profile updated successfully"})


@app.get("/movies/{movie_id}/comments", response=list[CommentMovieSchema])
def get_comments(request, movie_id: int):
    comments = Comments.objects.filter(movie=movie_id).select_related('user').order_by('-created_at').all()

    local_timezone = timezone.get_current_timezone()

    return [
        CommentMovieSchema(
            id=comment.id,
            user_id=comment.user.id,
            username=comment.user.username,
            comment=comment.comment,
            created_at=comment.created_at.astimezone(local_timezone).strftime("%Y-%m-%d %H:%M:%S"),
            updated_at=comment.updated_at.astimezone(local_timezone).strftime("%Y-%m-%d %H:%M:%S")
        ) 
        for comment in comments
    ]


@app.post("/movies/{movie_id}/comments", auth=django_auth)
def add_comment(request, movie_id: int, data: CommentCreateSchema):
    user = User.objects.get(id=data.user_id)

    if len(data.comment) < 2 or len(data.comment) > 1000:
        return JsonResponse({"error": "Comment length must be between 2 and 1000 characters"},  status=400)  

    Comments.objects.create(
        user=user,
        movie_id=movie_id,
        comment=data.comment
    )

    return JsonResponse({"success": "Comment posted successfully"})


@app.delete("/movies/{movie_id}/comments/{comment_id}", auth=django_auth)
def delete_comment(request, movie_id: int, comment_id: int):
    try:
        comment = get_object_or_404(Comments, id=comment_id, movie_id=movie_id)
        comment.delete()
        return JsonResponse({"success": "Comment deleted successfully"})
    except Exception as e:
        return JsonResponse({"error": "Failed to delete comment"}, status=500)

 
@app.put("/movies/{movie_id}/comments/{comment_id}", auth=django_auth)
def edit_comment(request, movie_id: int, comment_id: int, data: CommentEditSchema):
    comment = get_object_or_404(Comments, id=comment_id, movie_id=movie_id)

    comment.comment = data.comment

    if len(data.comment) < 2 or len(data.comment) > 1000:
        return JsonResponse({"error": "Comment length must be between 2 and 1000 characters"},  status=400)  
    
    comment.save()

    return JsonResponse({"success": "Comment edited successfully"})


@app.get("/movies/{movie_id}/ratings/{user_id}", auth=django_auth, response=RatingMovieSchema)
def get_rating(request, movie_id: int, user_id: int):
    user = User.objects.get(id=user_id)
    
    try:
        rating_instance = Ratings.objects.get(movie=movie_id, user=user)
        return rating_instance
    except Ratings.DoesNotExist:
        return RatingMovieSchema(rating=0, user_id=user_id)


@app.post("/movies/{movie_id}/ratings", auth=django_auth)
def add_rating(request, movie_id: int, data: RatingCreateSchema):
    user = User.objects.get(id=data.user_id)
    
    Ratings.objects.create(
        user=user,
        movie_id=movie_id,
        rating=data.rating
    )

    return JsonResponse({"success": "Rating submitted successfully"})


@app.put("/movies/{movie_id}/ratings/{rating_id}/update", auth=django_auth)
def edit_rating(request, movie_id: int, rating_id: int, data: RatingEditSchema):
    rating = get_object_or_404(Ratings, id=rating_id, movie_id=movie_id)

    rating.rating = data.rating
    rating.save()

    return JsonResponse({"success": "Rating edited successfully"})

@app.delete("/movies/{movie_id}/ratings/{rating_id}/delete", auth=django_auth)
def delete_rating(request, movie_id: int, rating_id: int):
    try:
        rating = get_object_or_404(Ratings, id=rating_id, movie_id=movie_id)
        rating.delete()
        return JsonResponse({"success": "Rating deleted successfully"})
    except Exception as e:
        return JsonResponse({"error": "Failed to delete rating"}, status=500)


@app.get("/movies/{movie_id}/recommendation", response=list[RecommendedMoviesSchema])
def get_movie_recs(request, movie_id: int):
    movie_queryset = Movie.objects.prefetch_related(
        Prefetch('moviesactors_set', queryset=MoviesActors.objects.select_related('actor')),
        Prefetch('moviesdirectors_set', queryset=MoviesDirectors.objects.select_related('director')),
        'genres'
    )

    actors_list, directors_list, genres_list = [], [], []

    for movie in movie_queryset:
        movie_actors = [f"{actor.actor.first_name}{actor.actor.last_name}" for actor in movie.moviesactors_set.all()]
        movie_directors = [f"{director.director.first_name}{director.director.last_name}" for director in movie.moviesdirectors_set.all()]
        movie_genres = [genre.name.replace(" ", "") for genre in movie.genres.all()]
        
        actors_list.append(', '.join(movie_actors))
        directors_list.append(', '.join(movie_directors))
        genres_list.append(', '.join(movie_genres))

    movie_df = read_frame(movie_queryset)
    movie_df['actors'] = actors_list
    movie_df['directors'] = directors_list
    movie_df['genres'] = genres_list

    columns = ['id', 'title', 'actors', 'directors', 'genres', 'release_year']
    movie_df = movie_df[columns]
    
    def create_soup(x):
        return ''.join(x['actors']) + ' ' + ''.join(x['directors']) + ' ' + ''.join(x['genres'])
    
    movie_df['soup'] = movie_df.apply(create_soup, axis=1)

    count = CountVectorizer(stop_words='english', min_df=1)
    count_matrix = count.fit_transform(movie_df['soup'])
    cosine_sim2 = cosine_similarity(count_matrix, count_matrix)
    
    movie_df = movie_df.reset_index()
    indices = pd.Series(movie_df.index, index=movie_df['id'])

    def get_recommendations(movie_id, cosine_sim):
        idx = indices[movie_id]
        sim_scores = list(enumerate(cosine_sim[idx]))
        sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)

        sim_scores = sim_scores[1:11]

        movie_indices = [index for index, _ in sim_scores]

        return movie_df[['id', 'title', 'release_year']].iloc[movie_indices]

    movie_rec_df = get_recommendations(movie_id, cosine_sim2)

    return movie_rec_df.apply(
        lambda row: RecommendedMoviesSchema(
            id=row['id'],
            title=row['title'],
            release_year=row['release_year']
        ), 
        axis=1)


@app.get("/profile/{user_id}/recommendation", response=list[PredictedMoviesSchema], auth=django_auth)
def get_user_recs(request, user_id: int):
    all_users_ratings = Ratings.objects.all().values('user__id', 'movie__title', 'movie__id', 'rating', 'movie__release_year')
    all_users_ratings_df = read_frame(all_users_ratings)

    if all_users_ratings_df.empty:
        return JsonResponse({"error": "Ratings not found"}, status=404)
    
    user_movie_matrix = all_users_ratings_df.pivot_table(index='user__id', columns='movie__id', values='rating').fillna(0)

    if user_id not in user_movie_matrix.index:
        return JsonResponse({"error": "User ratings not found. Rate movies in order to get recommendations"}, status=404)
    
    knn = NearestNeighbors(metric='euclidean', algorithm='brute')
    knn.fit(user_movie_matrix)
    
    user_ratings = Ratings.objects.filter(user=user_id).values('user__id', 'movie__id', 'rating')
    user_ratings_df = read_frame(user_ratings)
  
    user__ratings_vector = user_movie_matrix.loc[user_id].values.reshape(1, -1)
    
    n_neighbors = min(10, user_movie_matrix.shape[0] // 2)
    
    distances, indices = knn.kneighbors(user__ratings_vector, n_neighbors=n_neighbors)
    
    similar_user_ids = [user_movie_matrix.index[i] for i in indices.flatten()]
    
    similar_users_ratings = all_users_ratings_df[all_users_ratings_df['user__id'].isin(similar_user_ids)]
    
    unrated_movies = similar_users_ratings[~similar_users_ratings['movie__id'].isin(user_ratings_df['movie__id'])]
    
    recommended_movies = unrated_movies.groupby('movie__id').agg(
        estimated_rating=('rating', 'mean'),
        movie__title=('movie__title', 'first'),
        movie__release_year=('movie__release_year', 'first')
    ).reset_index()
    
    recommended_movies = recommended_movies.sort_values(by='estimated_rating', ascending=False).head(20)
    
    if recommended_movies.empty:
        return JsonResponse({"error": "Recommendation is not possible"}, status=400)

    return recommended_movies.apply(
        lambda row: PredictedMoviesSchema(
            id=row['movie__id'],
            title=row['movie__title'],
            release_year=row['movie__release_year'],
            estimated_rating=row['estimated_rating'],
        ), 
        axis=1)
    

@app.get("/profile/{user_id}/lists", response=list[MovieListsSchema], auth=django_auth)
def get_user_lists(request, user_id: int):
    user = User.objects.get(id=user_id)
    user_movie_lists = MovieList.objects.filter(user=user)

    local_timezone = timezone.get_current_timezone()
    
    return [
        MovieListsSchema(
            id=movie_list.id,
            name=movie_list.name,
            description=movie_list.description,
            created_at=movie_list.created_at.astimezone(local_timezone).strftime("%Y-%m-%d %H:%M:%S"),
            updated_at=movie_list.updated_at.astimezone(local_timezone).strftime("%Y-%m-%d %H:%M:%S")
        ) for movie_list in user_movie_lists
    ]


@app.get("/lists/{list_id}", response=ListedMoviesSchema, auth=django_auth)
def get_user_list(request, list_id: int):
    movie_list = get_object_or_404(MovieList, id=list_id)

    return ListedMoviesSchema(
        id=movie_list.id,
        user=UserOut(
            id=movie_list.user.id,
            username=movie_list.user.username
        ),
        name=movie_list.name,
        description=movie_list.description,
        movies=[
            MovieInList(
                id=movie.id, 
                title=movie.title, 
                release_year=movie.release_year,
                runtime=movie.runtime,
                genres=[
                    GenreSchema(
                        id=genre.id,
                        name=genre.name,
                    ) for genre in movie.genres.all()
                ],
                overview=movie.overview,
            ) 
            for movie in movie_list.movies.all()
        ]
    )


@app.post("/profile/{user_id}/lists/", auth=django_auth)
def create_user_list(request, user_id: int, data: ListCreateSchema):
    user = User.objects.get(id=data.user)

    MovieList.objects.create(
        name=data.name,
        description=data.description,
        user=user
    )

    return JsonResponse({"success": "List created successfully"})


@app.put("/profile/{user_id}/lists/{list_id}/update", auth=django_auth)
def edit_user_list(request, user_id: int, list_id: int, data: ListUpdateSchema):
    user_list = get_object_or_404(MovieList, id=list_id)

    if data.name:
        user_list.name = data.name
    
    if data.description:
        user_list.description = data.description

    user_list.save()

    return JsonResponse({"success": "List updated successfully"})


@app.delete("/profile/{user_id}/lists/{list_id}/delete", auth=django_auth)
def delete_user_list(request, user_id: int, list_id: int):
    try:
        user_list = get_object_or_404(MovieList, id=list_id)
        user_list.delete()
        return JsonResponse({"success": f"List {user_list.name} deleted successfully"})
    except Exception as e:
        return JsonResponse({"error": "Failed to delete list"}, status=500)


@app.post("/profile/{user_id}/lists/{list_id}/add/{movie_id}", auth=django_auth)
def add_movie_user_list(request, user_id: int, list_id: int, movie_id, data: AddMovieToList):
    movie_list = MovieList.objects.get(id=data.list_id)
    movie = Movie.objects.get(id=data.movie_id)

    if MovieListMovies.objects.filter(movie_list=movie_list, movie=movie).exists():
        return JsonResponse({"error": "Movie already exists in the list!"}, status=400)

    MovieListMovies.objects.create(
        movie_list=movie_list,
        movie=movie
    )

    return JsonResponse({"success": "Movie added successfully!"})


@app.delete("/lists/{list_id}/remove/{movie_id}", auth=django_auth)
def remove_movie_user_list(request, list_id: int, movie_id: int):
    try:
        movie = get_object_or_404(MovieListMovies, movie_list=list_id, movie=movie_id)
        movie.delete()
        return JsonResponse({"success": f"Movie {movie.movie.title} removed successfully"})
    except Exception as e:
        return JsonResponse({"error": "Failed to remove movie from list"}, status=500)
