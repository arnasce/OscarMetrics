from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator, MinLengthValidator, MaxLengthValidator
from datetime import date
from django.contrib.auth.models import User, AbstractUser
import os
import uuid


class Movie(models.Model):
    id = models.AutoField(primary_key=True)
    release_year = models.PositiveIntegerField(
        validators=[MinValueValidator(1927), MaxValueValidator(date.today().year)])
    title = models.CharField(max_length=80)
    tagline = models.CharField(max_length=250, null=True, blank=True)
    runtime = models.PositiveIntegerField(validators=[MaxValueValidator(900)], null=True, blank=True)
    budget = models.PositiveIntegerField(validators=[MinValueValidator(0)], null=True, blank=True)
    revenue = models.PositiveBigIntegerField(validators=[MinValueValidator(0)], null=True, blank=True)
    overview = models.TextField(null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)

    genres = models.ManyToManyField('Genre', through='MoviesGenres')
    directors = models.ManyToManyField('Person', through='MoviesDirectors', related_name='directed_movies')
    actors = models.ManyToManyField('Person', through='MoviesActors', related_name='acted_movies')
    oscar_wins = models.ManyToManyField('OscarCategory', through='OscarWinsMovie')
    
    comments_by_profiles = models.ManyToManyField('User', through='Comments', related_name='comments_on_movies')
    ratings_by_profiles = models.ManyToManyField('User', through='Ratings', related_name='ratings_on_movies')

    def __str__(self):
        return f'{self.title}'


class Genre(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=25)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)

    def __str__(self):
        return f'{self.name}'


class MoviesGenres(models.Model):
    id = models.AutoField(primary_key=True)
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE)
    genre = models.ForeignKey(Genre, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)

    class Meta:
        verbose_name = 'Movie Genre Relation'
        verbose_name_plural = 'Movies Genres Relations'

    def __str__(self):
        return f'{self.id}'


class Person(models.Model):
    id = models.AutoField(primary_key=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50, null=True, blank=True)
    birthday = models.DateField(null=True, blank=True, default='', validators=[MaxValueValidator(date.today())])
    place_of_birth = models.CharField(max_length=150, null=True, blank=True)
    biography = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)

    oscar_wins = models.ManyToManyField('OscarCategory', through='OscarWinsPerson')

    class Meta:
        verbose_name = 'person'
        verbose_name_plural = 'people'

    def __str__(self):
        return f'{self.first_name} {self.last_name}'


class MoviesDirectors(models.Model):
    id = models.AutoField(primary_key=True)
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE)
    director = models.ForeignKey(Person, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)

    class Meta:
        verbose_name = 'Movie Director Relation'
        verbose_name_plural = 'Movies Directors Relations'

    def __str__(self):
        return f'{self.id} {self.movie} {self.director}'


class MoviesActors(models.Model):
    id = models.AutoField(primary_key=True)
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE)
    actor = models.ForeignKey(Person, on_delete=models.CASCADE)
    character = models.CharField(max_length=150, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)

    class Meta:
        verbose_name = 'Movie Actor Relation'
        verbose_name_plural = 'Movies Actors Relations'

    def __str__(self):
        return f'{self.id} {self.movie} {self.actor} {self.character}'


class OscarCategory(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=150)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)

    class Meta:
        verbose_name = 'Oscar Category'
        verbose_name_plural = 'Oscar Categories'

    def __str__(self):
        return f'{self.name}'


class OscarWinsMovie(models.Model):
    id = models.AutoField(primary_key=True)
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE)
    category = models.ForeignKey(OscarCategory, on_delete=models.CASCADE)
    year = models.PositiveIntegerField(validators=[MinValueValidator(1927), MaxValueValidator(date.today().year)])
    ceremony = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(date.today().year - 1928)])
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)

    class Meta:
        verbose_name = 'Oscar Wins Movie Relation'
        verbose_name_plural = 'Oscar Wins Movies Relations'

    def __str__(self):
        return f'{self.id}: {self.movie} category {self.category}'


class OscarWinsPerson(models.Model):
    id = models.AutoField(primary_key=True)
    person = models.ForeignKey(Person, on_delete=models.CASCADE)
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE)
    category = models.ForeignKey(OscarCategory, on_delete=models.CASCADE)
    year = models.PositiveIntegerField(validators=[MinValueValidator(1927), MaxValueValidator(date.today().year)])
    ceremony = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(date.today().year - 1928)])
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)

    class Meta:
        verbose_name = 'Oscar Wins Person Relation'
        verbose_name_plural = 'Oscar Wins People Relations'

    def __str__(self):
        return f'{self.id} {self.person} {self.movie} {self.category} {self.year} {self.ceremony}'
    

def profile_pic_rename(instance, filename):
    extension = filename.split('.')[-1]
    unique_filename = f"{uuid.uuid4().hex}.{extension}"
    return os.path.join('profile_pics', unique_filename)

   
class User(AbstractUser):
    profile_picture = models.ImageField(upload_to=profile_pic_rename, null=True, blank=True)
    bio = models.TextField(max_length=500, null=True, blank=True)
    commented_movies = models.ManyToManyField('Movie', through='Comments', related_name='user_comments')
    rated_movies = models.ManyToManyField('Movie', through='Ratings', related_name='user_ratings')

   
class Comments(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_comments')
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE, related_name='movie_comments')
    comment = models.TextField(validators=[MinLengthValidator(2), MaxLengthValidator(1000)])
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)

    class Meta:
        verbose_name_plural = 'Comments'

    def __str__(self):
        return f'{self.id}'


class Ratings(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_ratings')
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE, related_name='movie_ratings')
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)

    class Meta:
        verbose_name_plural = 'Ratings'

    def __str__(self):
        return f'{self.id}'


class MovieList(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100)
    description = models.TextField(null=True, blank=True, validators=[MaxLengthValidator(1000)])
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='movie_lists')
    movies = models.ManyToManyField(Movie, through='MovieListMovies')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Movie List'
        verbose_name_plural = 'Movie Lists'

    def __str__(self):
        return f'{self.name} ({self.user})'


class MovieListMovies(models.Model):
    id = models.AutoField(primary_key=True)
    movie_list = models.ForeignKey(MovieList, on_delete=models.CASCADE)
    movie = models.ForeignKey(Movie, on_delete=models.CASCADE)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Movies Lists Relation'
        verbose_name_plural = 'Movies Lists Relations'

    def __str__(self):
        return f'{self.movie_list} - {self.movie}'
