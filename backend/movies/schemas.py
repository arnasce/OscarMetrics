
from movies.models import Movie, Genre
from movies.models import Person
from movies.models import OscarCategory

from ninja import ModelSchema, Schema

from datetime import date
from typing import Optional


class GenreSchema(ModelSchema):
    class Meta:
        model = Genre
        fields = ('id', 'name')


class OscarCategorySchema(ModelSchema):
    class Meta:
        model = OscarCategory
        fields = ('id', 'name')


class OscarWinsPersonSchema(Schema):
    id: int
    movie_id: int
    movie_title: str
    category: str
    year: int
    ceremony: int


class PersonSchemaForMovies(Schema):
    id: int
    first_name: str
    last_name: str


class OscarWinsMovieSchema(Schema):
    id: int
    category: str
    year: int
    ceremony: int
    person: Optional[PersonSchemaForMovies]


class ActorSchemaForMovies(Schema):
    id: int
    first_name: str
    last_name: str
    character: Optional[str]


class DirectorSchemaForMovies(Schema):
    id: int
    first_name: str
    last_name: str


class ActorFilmographySchema(Schema):
    id: int
    title: str
    release_year: int


class PersonSchema(ModelSchema):
    class Meta:
        model = Person
        fields = ('id', 'first_name', 'last_name', 'birthday', 'place_of_birth', 'biography')

    birthday: Optional[date]
    filmography: list[ActorFilmographySchema] = []
    oscar_wins: list[OscarWinsPersonSchema] = []


class MoviePageSchema(ModelSchema):
    class Meta:
        model = Movie
        fields = ('id', 'title', 'release_year', 'runtime', 'tagline')

    genres: list[GenreSchema]
    directors: list[DirectorSchemaForMovies] = []
    actors: list[ActorSchemaForMovies] = []
    budget: int = None
    revenue: int = None
    overview: str
    movie_oscar_wins: list[OscarWinsMovieSchema] = []
    

class MovieListSchema(ModelSchema):
    class Meta:
        model = Movie
        fields = ('id', 'title', 'release_year', 'runtime')

    genres: list[GenreSchema]
    directors: list[PersonSchemaForMovies]
    actors: list[PersonSchemaForMovies]
    overview: str


class RecommendedMoviesSchema(Schema):
    id: int
    title: str
    release_year: int


class PredictedMoviesSchema(Schema):
    id: int
    title: str
    release_year: int
    estimated_rating: float


class UserOut(Schema):
    id: int
    username: str


class LoginIn(Schema):
    username: str
    password: str


class Register(Schema):
    username: str
    password: str
    email: str
    

class ProfileInfo(Schema):
    id: int
    username: str
    first_name: str
    last_name: str
    profile_picture: Optional[str]
    date_joined: str
    bio: str


class EditProfileInfo(Schema):
    first_name: Optional[str]
    last_name: Optional[str]
    current_password: Optional[str]
    new_password: Optional[str]
    new_password_repeat: Optional[str]
    bio: Optional[str]


class CommentMovieSchema(Schema):
    id: int
    user_id: int
    username: str
    comment: str
    created_at: str
    updated_at: str


class CommentCreateSchema(Schema):
    movie_id: int
    user_id: int
    comment: str


class CommentEditSchema(Schema):
    comment: str


class RatingMovieSchema(Schema):
    id: Optional[int] = None
    rating: int
    user_id: int


class RatingCreateSchema(Schema):
    user_id: int
    rating: int


class RatingEditSchema(Schema):
    rating: int


class MovieInList(Schema):
    id: int
    title: str
    release_year: int
    runtime: int
    genres: list[GenreSchema]
    overview: str
    

class ListedMoviesSchema(Schema):
    id: int
    user: UserOut
    name: str
    description: str
    movies: list[MovieInList]


class MovieListsSchema(Schema):
    id: int
    name: str
    description: str
    created_at: str
    updated_at: str


class ListCreateSchema(Schema):
    name: str
    description: str
    user: int


class ListUpdateSchema(Schema):
    name: str
    description: str


class AddMovieToList(Schema):
    list_id: int
    movie_id: int
