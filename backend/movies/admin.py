from django.contrib import admin
from django import forms
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import UserChangeForm


from .models import Movie, Genre, MoviesGenres
from .models import Person, MoviesDirectors, MoviesActors
from .models import OscarCategory, OscarWinsMovie, OscarWinsPerson
from .models import Comments, Ratings, MovieList, MovieListMovies
from .models import User


class UserAdmin(BaseUserAdmin):
    form = UserChangeForm
    model = User
    list_display = ('id', 'username', 'email', 'first_name', 'last_name', 'is_staff')
    list_display_links = ('id', 'username',)
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'email', 'profile_picture', 'bio')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    search_fields = ('username', 'email', 'first_name', 'last_name')


class MovieForm(forms.ModelForm):
    directors = forms.ModelMultipleChoiceField(queryset=Person.objects.all().order_by('last_name'), required=True)
    genres = forms.ModelMultipleChoiceField(queryset=Genre.objects.all().order_by('name'), required=True)
    actors = forms.ModelMultipleChoiceField(queryset=Person.objects.all().order_by('last_name'), required=True)

    class Meta:
        model = Movie
        fields = '__all__'

        
class MovieAdmin(admin.ModelAdmin):
    form = MovieForm
    list_display = ('id', 'title', 'release_year', 'director', 'genre', 'actor', 'runtime', 'created_at', 'updated_at')
    list_display_links = ('id', 'title',)
    list_filter = ('release_year', 'genres')
    search_fields = ('id', 'title')
    ordering = ('id',)
    list_per_page = 50

    def genre(self, obj):
        return ', '.join([str(genre) for genre in obj.genres.all()])

    def director(self, obj):
        return ', '.join([str(director) for director in obj.directors.all()])

    def actor(self, obj):
        return ', '.join([str(actor) for actor in obj.actors.all()])

class GenreAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'created_at', 'updated_at')
    list_display_links = ('id', 'name',)
    search_fields = ('id', 'name')
    ordering = ('id',)


class MoviesGenresAdmin(admin.ModelAdmin):
    list_display = ('id', 'movie', 'genre', 'created_at', 'updated_at')
    list_display_links = ('id', 'movie', 'genre')
    list_filter = ('genre',)
    search_fields = ('id', 'movie', 'genre')
    ordering = ('id',)
    list_per_page = 50


class PersonAdmin(admin.ModelAdmin):
    list_display = ('id', 'first_name', 'last_name', 'birthday', 'place_of_birth', 'created_at', 'updated_at')
    list_filter = ('birthday',)
    search_fields = ('id', 'first_name', 'last_name')
    ordering = ('id',)
    list_per_page = 50


class MoviesDirectorsAdmin(admin.ModelAdmin):
    list_display = ('id', 'movie', 'director', 'created_at', 'updated_at')
    search_fields = ('id', 'movie', 'director')
    ordering = ('id',)
    list_per_page = 50


class MoviesActorsAdmin(admin.ModelAdmin):
    list_display = ('id', 'movie', 'actor', 'character', 'created_at', 'updated_at')
    search_fields = ('id', 'movie', 'actor', 'character')
    ordering = ('id',)
    list_per_page = 50


class OscarCategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'created_at', 'updated_at')
    list_display_links = ('id', 'name',)
    search_fields = ('id', 'name')
    ordering = ('id',)
    list_per_page = 50


class OscarWinsMovieAdmin(admin.ModelAdmin):
    list_display = ('id', 'year', 'ceremony', 'category', 'movie', 'created_at', 'updated_at')
    list_display_links = ('id', 'year', 'ceremony', 'category', 'movie')
    list_filter = ('category', 'movie', 'ceremony', 'year')
    search_fields = ('id', 'year', 'ceremony', 'category', 'movie')
    ordering = ('id',)
    list_per_page = 50


class OscarWinsPersonAdmin(admin.ModelAdmin):
    list_display = ('id', 'year', 'ceremony', 'person', 'category', 'movie', 'created_at', 'updated_at')
    search_fields = ('id', 'year', 'ceremony', 'category')
    ordering = ('id',)
    list_per_page = 50


class CommentsAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'movie', 'comment', 'created_at', 'updated_at')
    search_fields = ('id', 'user', 'movie')
    ordering = ('created_at',)
    list_per_page = 50


class RatingsAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'movie', 'rating', 'created_at', 'updated_at')
    search_fields = ('id', 'user', 'movie')
    ordering = ('created_at',)
    list_per_page = 50


class MovieListAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'description', 'user', 'created_at', 'updated_at')
    search_fields = ('id', 'user')
    ordering = ('created_at',)
    list_per_page = 50


class MovieListMoviesAdmin(admin.ModelAdmin):
    list_display = ('id', 'movie_list', 'movie', 'added_at')
    search_fields = ('id', 'movie_list', 'movie')
    ordering = ('added_at',)
    list_per_page = 50


admin.site.register(User, UserAdmin)
admin.site.register(Movie, MovieAdmin)
admin.site.register(Genre, GenreAdmin)
admin.site.register(MoviesGenres, MoviesGenresAdmin)
admin.site.register(Person, PersonAdmin)
admin.site.register(MoviesDirectors, MoviesDirectorsAdmin)
admin.site.register(MoviesActors, MoviesActorsAdmin)
admin.site.register(OscarCategory, OscarCategoryAdmin)
admin.site.register(OscarWinsMovie, OscarWinsMovieAdmin)
admin.site.register(OscarWinsPerson, OscarWinsPersonAdmin)
admin.site.register(Comments, CommentsAdmin)
admin.site.register(Ratings, RatingsAdmin)
admin.site.register(MovieList, MovieListAdmin)
admin.site.register(MovieListMovies, MovieListMoviesAdmin)
