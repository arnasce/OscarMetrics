from django.core.management.base import BaseCommand

from movies.models import Movie, Genre, MoviesGenres
from movies.models import Person, MoviesDirectors, MoviesActors
from movies.models import OscarCategory, OscarWinsMovie, OscarWinsPerson

import csv


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument('model_name', type=str)
        parser.add_argument('file_path', type=str, nargs='?')

    def handle(self, *args, **options):
        file_path = options['file_path']
        model_name = options['model_name']

        if model_name == 'all':
            Command.seed_all()
        else:
            if not file_path:
                self.stdout.write(self.style.ERROR('File path is missing.'))
                return

            if model_name == 'movie':
                Command.seed_movie(file_path)
            elif model_name == 'genre':
                Command.seed_genre(file_path)
            elif model_name == 'movies_genres':
                Command.seed_movies_genres(file_path)
            elif model_name == 'oscar_categories':
                Command.seed_oscar_categories(file_path)
            elif model_name == 'oscar_wins_movie':
                Command.seed_oscar_wins_movie(file_path)
            elif model_name == 'people':
                Command.seed_people(file_path)
            elif model_name == 'movies_actors':
                Command.seed_movies_actors(file_path)
            elif model_name == 'movies_directors':
                Command.seed_movies_directors(file_path)
            elif model_name == 'oscar_wins_person':
                Command.seed_oscar_wins_person(file_path)

        self.stdout.write(self.style.SUCCESS(f'{model_name} seeded successfully'))

    @staticmethod
    def seed_movie(file_path):
        with open(file_path, 'r',  encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                movie = Movie(id=int(row['movie_id']),
                              release_year=int(row['year']),
                              title=row['title'],
                              tagline=row['tagline'],
                              runtime=int(row['runtime']),
                              budget=int(row['budget']),
                              revenue=int(row['revenue']),
                              overview=row['overview'])

                movie.save()

    @staticmethod
    def seed_genre(file_path):
        with open(file_path, 'r') as file:
            reader = csv.DictReader(file)
            for row in reader:
                genre = Genre(id=int(row['genre_id']),
                              name=row['genre'])

                genre.save()

    @staticmethod
    def seed_movies_genres(file_path):
        with open(file_path, 'r') as file:
            reader = csv.DictReader(file)
            for row in reader:
                movie_id = Movie.objects.get(id=int(row['movie_id']))
                genre_id = Genre.objects.get(id=int(row['genre_id']))

                movies_genres = MoviesGenres(movie=movie_id, genre=genre_id)
                movies_genres.save()

    @staticmethod
    def seed_oscar_categories(file_path):
        with open(file_path, 'r') as file:
            reader = csv.DictReader(file)
            for row in reader:
                oscar_category = OscarCategory(id=int(row['category_id']),
                                               name=row['category_name'])

                oscar_category.save()

    @staticmethod
    def seed_oscar_wins_movie(file_path):
        with open(file_path, 'r') as file:
            reader = csv.DictReader(file)
            for row in reader:
                movie_id = Movie.objects.get(id=int(row['movie_id']))
                category_id = OscarCategory.objects.get(id=int(row['category_id']))
                oscar_wins_movie = OscarWinsMovie(movie=movie_id,
                                                  category=category_id,
                                                  year=int(row['year_ceremony']),
                                                  ceremony=int(row['ceremony']))
                oscar_wins_movie.save()


    @staticmethod
    def seed_people(file_path):
        with open(file_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                birthday_date = row['birthday']

                if not birthday_date:
                    birthday_date = None

                person = Person(id=int(row['person_id']),
                                first_name=row['first_name'],
                                last_name=row['last_name'],
                                birthday=birthday_date,
                                place_of_birth=row['place_of_birth'],
                                biography=row['biography'])

                person.save()

    @staticmethod
    def seed_movies_actors(file_path):
        with open(file_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                movie_id = Movie.objects.get(id=row['movie_id'])
                actor_id = Person.objects.get(id=row['actor_id'])
                movies_actors = MoviesActors(movie=movie_id, actor=actor_id, character=row['character'])

                movies_actors.save()

    @staticmethod
    def seed_movies_directors(file_path):
        with open(file_path, 'r') as file:
            reader = csv.DictReader(file)
            for row in reader:
                movie_id = Movie.objects.get(id=int(row['movie_id']))
                director_id = Person.objects.get(id=int(row['director_id']))

                movies_directors = MoviesDirectors(movie=movie_id, director=director_id)
                movies_directors.save()


    @staticmethod
    def seed_oscar_wins_person(file_path):
        with open(file_path, 'r') as file:
            reader = csv.DictReader(file)
            for row in reader:
                person_id = Person.objects.get(id=int(row['person_id']))
                category_id = OscarCategory.objects.get(id=int(row['category_id']))
                movie_id = Movie.objects.get(id=int(row['movie_id']))

                oscar_wins_person = OscarWinsPerson(person=person_id,
                                                    category=category_id,
                                                    movie=movie_id,
                                                    year=int(row['year_ceremony']),
                                                    ceremony=int(row['ceremony']))
                oscar_wins_person.save()

    @staticmethod
    def seed_all():
        Command.seed_movie('movies/data/movies.csv')
        Command.seed_genre('movies/data/genres.csv')
        Command.seed_movies_genres('movies/data/movies_genres.csv')
        Command.seed_oscar_categories('movies/data/oscar_categories.csv')
        Command.seed_oscar_wins_movie('movies/data/oscar_wins_movies.csv')
        Command.seed_people('movies/data/people.csv')
        Command.seed_movies_actors('movies/data/movies_actors.csv')
        Command.seed_movies_directors('movies/data/movies_directors.csv')
        Command.seed_oscar_wins_person('movies/data/oscar_wins_people.csv')

