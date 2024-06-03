# OscarMetrics

OscarMetrics is a website that provides comprehensive information on Oscar-winning movies, from the inaugural ceremony in 1927 to the most recent ceremony in 2024. Registered movie buffs can rate, comment and add movies to lists as well as receive recommendations based on collaborative filtering.

![screenshot_1](https://github.com/arnasce/OscarMetrics/assets/63949706/67c8fdbb-160c-4c5d-aff9-77cb37a77024)

## Instructions
1. Install Python dependencies:
    ```
    cd backend
    pip install −r requirements.txt
    ```

2. Add PostgreSQL database information to settings.py:
    ```
    DATABASES = {
            'default': {
                "ENGINE": "django.db.backends.postgresql",
                "NAME": "",
                "USER": "",
                "PASSWORD": "",
                "HOST": "",
                "PORT": "",
            }
        }
    ```

3. Make migrations and seed database with prepared data:
    ```
    python3 manage.py makemigrations
    python3 manage.py migrate
    python3 manage.py seed all
    ```

4. Run backend server:
    ```
    python3 manage.py runserver
    ```

5. Add your TMDB API key as VITE_TMDB_API_KEY value in .env file to show movie posters.

6. Install Node.js dependencies and run frontend server:
    ```
    cd frontend
    npm install
    npm run dev
    ```
