/**
 * Smart Meal Planner - Backend Server
 * 
 * Dependencies:
 * - libmicrohttpd
 * - libcurl
 * - libsqlite3
 * - cJSON
 * 
 * Compile: make
 * Run: ./server [port] (default: 8080)
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <sqlite3.h>
#include <microhttpd.h>
#include <curl/curl.h>
#include <cjson/cJSON.h>
#include <time.h>

#define DEFAULT_PORT 8080
#define DB_NAME "mealplanner.db"
#define SPOONACULAR_API_KEY "YOUR_API_KEY_HERE"  // Replace with your Spoonacular API key
#define SPOONACULAR_BASE_URL "https://api.spoonacular.com/recipes"

/* Database connection */
static sqlite3 *db = NULL;

/* Structure to hold request data */
struct RequestData {
    char *data;
    size_t size;
};

/* cURL write callback for API responses */
static size_t write_callback(void *contents, size_t size, size_t nmemb, void *userp) {
    size_t realsize = size * nmemb;
    struct RequestData *req = (struct RequestData *)userp;
    
    char *ptr = realloc(req->data, req->size + realsize + 1);
    if (!ptr) {
        return 0;
    }
    
    req->data = ptr;
    memcpy(&(req->data[req->size]), contents, realsize);
    req->size += realsize;
    req->data[req->size] = 0;
    
    return realsize;
}

/* Initialize SQLite database */
static int init_database() {
    int rc = sqlite3_open(DB_NAME, &db);
    if (rc) {
        fprintf(stderr, "Can't open database: %s\n", sqlite3_errmsg(db));
        return -1;
    }
    
    const char *create_users = 
        "CREATE TABLE IF NOT EXISTS users ("
        "id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "username TEXT UNIQUE,"
        "password TEXT"
        ");";
    
    const char *create_favorites = 
        "CREATE TABLE IF NOT EXISTS favorites ("
        "id INTEGER PRIMARY KEY AUTOINCREMENT,"
        "user_id INTEGER,"
        "recipe_id INTEGER,"
        "recipe_name TEXT"
        ");";
    
    char *err_msg = NULL;
    rc = sqlite3_exec(db, create_users, NULL, 0, &err_msg);
    if (rc != SQLITE_OK) {
        fprintf(stderr, "SQL error (users): %s\n", err_msg);
        sqlite3_free(err_msg);
        return -1;
    }
    
    rc = sqlite3_exec(db, create_favorites, NULL, 0, &err_msg);
    if (rc != SQLITE_OK) {
        fprintf(stderr, "SQL error (favorites): %s\n", err_msg);
        sqlite3_free(err_msg);
        return -1;
    }
    
    printf("Database initialized successfully\n");
    return 0;
}

/* Create JSON response */
static char *create_json_response(const char *key, const char *value) {
    cJSON *json = cJSON_CreateObject();
    cJSON_AddStringToObject(json, key, value);
    char *json_str = cJSON_Print(json);
    cJSON_Delete(json);
    return json_str;
}

/* Create JSON response with object */
static char *create_json_object(cJSON *obj) {
    return cJSON_Print(obj);
}



/* Fetch recipes from Spoonacular API */
static char *fetch_recipes_from_spoonacular(const char *ingredients) {
    CURL *curl;
    CURLcode res;
    struct RequestData req_data = {0};
    
    curl = curl_easy_init();
    if (!curl) {
        return NULL;
    }
    
    char url[512];
    snprintf(url, sizeof(url), 
        "%s/findByIngredients?ingredients=%s&number=5&apiKey=%s",
        SPOONACULAR_BASE_URL, ingredients, SPOONACULAR_API_KEY);
    
    curl_easy_setopt(curl, CURLOPT_URL, url);
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, write_callback);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, (void *)&req_data);
    curl_easy_setopt(curl, CURLOPT_FOLLOWLOCATION, 1L);
    
    res = curl_easy_perform(curl);
    
    if (res != CURLE_OK) {
        fprintf(stderr, "curl_easy_perform() failed: %s\n", curl_easy_strerror(res));
        curl_easy_cleanup(curl);
        if (req_data.data) free(req_data.data);
        return NULL;
    }
    
    curl_easy_cleanup(curl);
    
    return req_data.data;
}

/* GET /health handler */
static int handle_health(struct MHD_Connection *connection) {
    char *json = create_json_response("status", "ok");
    struct MHD_Response *response = MHD_create_response_from_buffer(
        strlen(json), json, MHD_RESPMEM_MUST_FREE);
    MHD_add_response_header(response, "Content-Type", "application/json");
    MHD_add_response_header(response, "Access-Control-Allow-Origin", "*");
    int ret = MHD_queue_response(connection, MHD_HTTP_OK, response);
    MHD_destroy_response(response);
    return ret;
}

/* POST /recipes handler */
static int handle_recipes(struct MHD_Connection *connection, const char *body) {
    cJSON *json = cJSON_Parse(body);
    if (!json) {
        char *err = create_json_response("error", "Invalid JSON");
        struct MHD_Response *response = MHD_create_response_from_buffer(
            strlen(err), err, MHD_RESPMEM_MUST_FREE);
        MHD_add_response_header(response, "Content-Type", "application/json");
        MHD_add_response_header(response, "Access-Control-Allow-Origin", "*");
        int ret = MHD_queue_response(connection, MHD_HTTP_BAD_REQUEST, response);
        MHD_destroy_response(response);
        return ret;
    }
    
    cJSON *ingredients_json = cJSON_GetObjectItem(json, "ingredients");
    if (!cJSON_IsString(ingredients_json)) {
        cJSON_Delete(json);
        char *err = create_json_response("error", "Missing or invalid 'ingredients' field");
        struct MHD_Response *response = MHD_create_response_from_buffer(
            strlen(err), err, MHD_RESPMEM_MUST_FREE);
        MHD_add_response_header(response, "Content-Type", "application/json");
        MHD_add_response_header(response, "Access-Control-Allow-Origin", "*");
        int ret = MHD_queue_response(connection, MHD_HTTP_BAD_REQUEST, response);
        MHD_destroy_response(response);
        return ret;
    }
    
    const char *ingredients = ingredients_json->valuestring;
    char *api_response = fetch_recipes_from_spoonacular(ingredients);
    
    cJSON_Delete(json);
    
    if (!api_response) {
        char *err = create_json_response("error", "Failed to fetch recipes from Spoonacular");
        struct MHD_Response *response = MHD_create_response_from_buffer(
            strlen(err), err, MHD_RESPMEM_MUST_FREE);
        MHD_add_response_header(response, "Content-Type", "application/json");
        MHD_add_response_header(response, "Access-Control-Allow-Origin", "*");
        int ret = MHD_queue_response(connection, MHD_HTTP_INTERNAL_SERVER_ERROR, response);
        MHD_destroy_response(response);
        return ret;
    }
    
    struct MHD_Response *response = MHD_create_response_from_buffer(
        strlen(api_response), api_response, MHD_RESPMEM_MUST_FREE);
    MHD_add_response_header(response, "Content-Type", "application/json");
    MHD_add_response_header(response, "Access-Control-Allow-Origin", "*");
    int ret = MHD_queue_response(connection, MHD_HTTP_OK, response);
    MHD_destroy_response(response);
    return ret;
}

/* POST /register handler */
static int handle_register(struct MHD_Connection *connection, const char *body) {
    cJSON *json = cJSON_Parse(body);
    if (!json) {
        char *err = create_json_response("error", "Invalid JSON");
        struct MHD_Response *response = MHD_create_response_from_buffer(
            strlen(err), err, MHD_RESPMEM_MUST_FREE);
        MHD_add_response_header(response, "Content-Type", "application/json");
        MHD_add_response_header(response, "Access-Control-Allow-Origin", "*");
        int ret = MHD_queue_response(connection, MHD_HTTP_BAD_REQUEST, response);
        MHD_destroy_response(response);
        return ret;
    }
    
    cJSON *username_json = cJSON_GetObjectItem(json, "username");
    cJSON *password_json = cJSON_GetObjectItem(json, "password");
    
    if (!cJSON_IsString(username_json) || !cJSON_IsString(password_json)) {
        cJSON_Delete(json);
        char *err = create_json_response("error", "Missing username or password");
        struct MHD_Response *response = MHD_create_response_from_buffer(
            strlen(err), err, MHD_RESPMEM_MUST_FREE);
        MHD_add_response_header(response, "Content-Type", "application/json");
        MHD_add_response_header(response, "Access-Control-Allow-Origin", "*");
        int ret = MHD_queue_response(connection, MHD_HTTP_BAD_REQUEST, response);
        MHD_destroy_response(response);
        return ret;
    }
    
    const char *username = username_json->valuestring;
    const char *password = password_json->valuestring;
    
    sqlite3_stmt *stmt;
    const char *sql = "INSERT INTO users (username, password) VALUES (?, ?)";
    
    int rc = sqlite3_prepare_v2(db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK) {
        cJSON_Delete(json);
        char *err = create_json_response("error", "Database error");
        struct MHD_Response *response = MHD_create_response_from_buffer(
            strlen(err), err, MHD_RESPMEM_MUST_FREE);
        MHD_add_response_header(response, "Content-Type", "application/json");
        MHD_add_response_header(response, "Access-Control-Allow-Origin", "*");
        int ret = MHD_queue_response(connection, MHD_HTTP_INTERNAL_SERVER_ERROR, response);
        MHD_destroy_response(response);
        return ret;
    }
    
    sqlite3_bind_text(stmt, 1, username, -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 2, password, -1, SQLITE_STATIC);
    
    rc = sqlite3_step(stmt);
    sqlite3_finalize(stmt);
    
    cJSON_Delete(json);
    
    char *response_json;
    if (rc == SQLITE_CONSTRAINT) {
        response_json = create_json_response("error", "Username already exists");
    } else if (rc != SQLITE_DONE) {
        response_json = create_json_response("error", "Registration failed");
    } else {
        response_json = create_json_response("message", "User registered successfully");
    }
    
    int status = (rc == SQLITE_DONE) ? MHD_HTTP_OK : MHD_HTTP_BAD_REQUEST;
    struct MHD_Response *response = MHD_create_response_from_buffer(
        strlen(response_json), response_json, MHD_RESPMEM_MUST_FREE);
    MHD_add_response_header(response, "Content-Type", "application/json");
    MHD_add_response_header(response, "Access-Control-Allow-Origin", "*");
    int ret = MHD_queue_response(connection, status, response);
    MHD_destroy_response(response);
    return ret;
}

/* POST /login handler */
static int handle_login(struct MHD_Connection *connection, const char *body) {
    cJSON *json = cJSON_Parse(body);
    if (!json) {
        char *err = create_json_response("error", "Invalid JSON");
        struct MHD_Response *response = MHD_create_response_from_buffer(
            strlen(err), err, MHD_RESPMEM_MUST_FREE);
        MHD_add_response_header(response, "Content-Type", "application/json");
        MHD_add_response_header(response, "Access-Control-Allow-Origin", "*");
        int ret = MHD_queue_response(connection, MHD_HTTP_BAD_REQUEST, response);
        MHD_destroy_response(response);
        return ret;
    }
    
    cJSON *username_json = cJSON_GetObjectItem(json, "username");
    cJSON *password_json = cJSON_GetObjectItem(json, "password");
    
    if (!cJSON_IsString(username_json) || !cJSON_IsString(password_json)) {
        cJSON_Delete(json);
        char *err = create_json_response("error", "Missing username or password");
        struct MHD_Response *response = MHD_create_response_from_buffer(
            strlen(err), err, MHD_RESPMEM_MUST_FREE);
        MHD_add_response_header(response, "Content-Type", "application/json");
        MHD_add_response_header(response, "Access-Control-Allow-Origin", "*");
        int ret = MHD_queue_response(connection, MHD_HTTP_BAD_REQUEST, response);
        MHD_destroy_response(response);
        return ret;
    }
    
    const char *username = username_json->valuestring;
    const char *password = password_json->valuestring;
    
    sqlite3_stmt *stmt;
    const char *sql = "SELECT id FROM users WHERE username = ? AND password = ?";
    
    int rc = sqlite3_prepare_v2(db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK) {
        cJSON_Delete(json);
        char *err = create_json_response("error", "Database error");
        struct MHD_Response *response = MHD_create_response_from_buffer(
            strlen(err), err, MHD_RESPMEM_MUST_FREE);
        MHD_add_response_header(response, "Content-Type", "application/json");
        MHD_add_response_header(response, "Access-Control-Allow-Origin", "*");
        int ret = MHD_queue_response(connection, MHD_HTTP_INTERNAL_SERVER_ERROR, response);
        MHD_destroy_response(response);
        return ret;
    }
    
    sqlite3_bind_text(stmt, 1, username, -1, SQLITE_STATIC);
    sqlite3_bind_text(stmt, 2, password, -1, SQLITE_STATIC);
    
    rc = sqlite3_step(stmt);
    int user_id = -1;
    if (rc == SQLITE_ROW) {
        user_id = sqlite3_column_int(stmt, 0);
    }
    sqlite3_finalize(stmt);
    
    cJSON_Delete(json);
    
    char *response_json;
    int status;
    if (user_id > 0) {
        cJSON *success_json = cJSON_CreateObject();
        cJSON_AddStringToObject(success_json, "message", "Login successful");
        cJSON_AddNumberToObject(success_json, "user_id", user_id);
        response_json = create_json_object(success_json);
        cJSON_Delete(success_json);
        status = MHD_HTTP_OK;
    } else {
        response_json = create_json_response("error", "Invalid credentials");
        status = MHD_HTTP_UNAUTHORIZED;
    }
    
    struct MHD_Response *response = MHD_create_response_from_buffer(
        strlen(response_json), response_json, MHD_RESPMEM_MUST_FREE);
    MHD_add_response_header(response, "Content-Type", "application/json");
    MHD_add_response_header(response, "Access-Control-Allow-Origin", "*");
    int ret = MHD_queue_response(connection, status, response);
    MHD_destroy_response(response);
    return ret;
}

/* POST /favorites/add handler */
static int handle_favorites_add(struct MHD_Connection *connection, const char *body) {
    cJSON *json = cJSON_Parse(body);
    if (!json) {
        char *err = create_json_response("error", "Invalid JSON");
        struct MHD_Response *response = MHD_create_response_from_buffer(
            strlen(err), err, MHD_RESPMEM_MUST_FREE);
        MHD_add_response_header(response, "Content-Type", "application/json");
        MHD_add_response_header(response, "Access-Control-Allow-Origin", "*");
        int ret = MHD_queue_response(connection, MHD_HTTP_BAD_REQUEST, response);
        MHD_destroy_response(response);
        return ret;
    }
    
    cJSON *user_id_json = cJSON_GetObjectItem(json, "user_id");
    cJSON *recipe_id_json = cJSON_GetObjectItem(json, "recipe_id");
    cJSON *recipe_name_json = cJSON_GetObjectItem(json, "recipe_name");
    
    if (!cJSON_IsNumber(user_id_json) || !cJSON_IsNumber(recipe_id_json) || 
        !cJSON_IsString(recipe_name_json)) {
        cJSON_Delete(json);
        char *err = create_json_response("error", "Missing required fields");
        struct MHD_Response *response = MHD_create_response_from_buffer(
            strlen(err), err, MHD_RESPMEM_MUST_FREE);
        MHD_add_response_header(response, "Content-Type", "application/json");
        MHD_add_response_header(response, "Access-Control-Allow-Origin", "*");
        int ret = MHD_queue_response(connection, MHD_HTTP_BAD_REQUEST, response);
        MHD_destroy_response(response);
        return ret;
    }
    
    int user_id = cJSON_GetNumberValue(user_id_json);
    int recipe_id = (int)cJSON_GetNumberValue(recipe_id_json);
    const char *recipe_name = recipe_name_json->valuestring;
    
    sqlite3_stmt *stmt;
    const char *sql = "INSERT INTO favorites (user_id, recipe_id, recipe_name) VALUES (?, ?, ?)";
    
    int rc = sqlite3_prepare_v2(db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK) {
        cJSON_Delete(json);
        char *err = create_json_response("error", "Database error");
        struct MHD_Response *response = MHD_create_response_from_buffer(
            strlen(err), err, MHD_RESPMEM_MUST_FREE);
        MHD_add_response_header(response, "Content-Type", "application/json");
        MHD_add_response_header(response, "Access-Control-Allow-Origin", "*");
        int ret = MHD_queue_response(connection, MHD_HTTP_INTERNAL_SERVER_ERROR, response);
        MHD_destroy_response(response);
        return ret;
    }
    
    sqlite3_bind_int(stmt, 1, user_id);
    sqlite3_bind_int(stmt, 2, recipe_id);
    sqlite3_bind_text(stmt, 3, recipe_name, -1, SQLITE_STATIC);
    
    rc = sqlite3_step(stmt);
    sqlite3_finalize(stmt);
    
    cJSON_Delete(json);
    
    char *response_json;
    int status;
    if (rc == SQLITE_DONE) {
        response_json = create_json_response("message", "Favorite added successfully");
        status = MHD_HTTP_OK;
    } else {
        response_json = create_json_response("error", "Failed to add favorite");
        status = MHD_HTTP_BAD_REQUEST;
    }
    
    struct MHD_Response *response = MHD_create_response_from_buffer(
        strlen(response_json), response_json, MHD_RESPMEM_MUST_FREE);
    MHD_add_response_header(response, "Content-Type", "application/json");
    MHD_add_response_header(response, "Access-Control-Allow-Origin", "*");
    int ret = MHD_queue_response(connection, status, response);
    MHD_destroy_response(response);
    return ret;
}

/* GET /favorites handler */
static int handle_favorites_get(struct MHD_Connection *connection, int user_id) {
    sqlite3_stmt *stmt;
    const char *sql = "SELECT id, recipe_id, recipe_name FROM favorites WHERE user_id = ?";
    
    int rc = sqlite3_prepare_v2(db, sql, -1, &stmt, NULL);
    if (rc != SQLITE_OK) {
        char *err = create_json_response("error", "Database error");
        struct MHD_Response *response = MHD_create_response_from_buffer(
            strlen(err), err, MHD_RESPMEM_MUST_FREE);
        MHD_add_response_header(response, "Content-Type", "application/json");
        MHD_add_response_header(response, "Access-Control-Allow-Origin", "*");
        int ret = MHD_queue_response(connection, MHD_HTTP_INTERNAL_SERVER_ERROR, response);
        MHD_destroy_response(response);
        return ret;
    }
    
    sqlite3_bind_int(stmt, 1, user_id);
    
    cJSON *favorites_array = cJSON_CreateArray();
    
    while ((rc = sqlite3_step(stmt)) == SQLITE_ROW) {
        cJSON *favorite = cJSON_CreateObject();
        cJSON_AddNumberToObject(favorite, "id", sqlite3_column_int(stmt, 0));
        cJSON_AddNumberToObject(favorite, "recipe_id", sqlite3_column_int(stmt, 1));
        cJSON_AddStringToObject(favorite, "recipe_name", 
            (const char *)sqlite3_column_text(stmt, 2));
        cJSON_AddItemToArray(favorites_array, favorite);
    }
    
    sqlite3_finalize(stmt);
    
    char *response_json = create_json_object(favorites_array);
    cJSON_Delete(favorites_array);
    
    struct MHD_Response *response = MHD_create_response_from_buffer(
        strlen(response_json), response_json, MHD_RESPMEM_MUST_FREE);
    MHD_add_response_header(response, "Content-Type", "application/json");
    MHD_add_response_header(response, "Access-Control-Allow-Origin", "*");
    int ret = MHD_queue_response(connection, MHD_HTTP_OK, response);
    MHD_destroy_response(response);
    return ret;
}

/* Main request handler */
static int answer_to_connection(void *cls, struct MHD_Connection *connection,
                                const char *url, const char *method,
                                const char *version, const char *upload_data,
                                size_t *upload_data_size, void **con_cls) {
    (void)cls;
    (void)version;
    
    if (*con_cls == NULL) {
        struct RequestData *req_data = malloc(sizeof(struct RequestData));
        if (!req_data) return MHD_NO;
        req_data->data = NULL;
        req_data->size = 0;
        *con_cls = req_data;
        return MHD_YES;
    }
    
    struct RequestData *req = (struct RequestData *)*con_cls;
    
    if (*upload_data_size != 0) {
        char *ptr = realloc(req->data, req->size + *upload_data_size + 1);
        if (!ptr) return MHD_NO;
        req->data = ptr;
        memcpy(&(req->data[req->size]), upload_data, *upload_data_size);
        req->size += *upload_data_size;
        req->data[req->size] = 0;
        *upload_data_size = 0;
        return MHD_YES;
    }
    
    /* Handle OPTIONS for CORS preflight */
    if (strcmp(method, "OPTIONS") == 0) {
        struct MHD_Response *response = MHD_create_response_from_buffer(0, NULL, MHD_RESPMEM_PERSISTENT);
        MHD_add_response_header(response, "Access-Control-Allow-Origin", "*");
        MHD_add_response_header(response, "Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        MHD_add_response_header(response, "Access-Control-Allow-Headers", "Content-Type");
        int ret = MHD_queue_response(connection, MHD_HTTP_OK, response);
        MHD_destroy_response(response);
        free(req->data);
        free(req);
        *con_cls = NULL;
        return ret;
    }
    
    /* Route requests */
    if (strcmp(method, "GET") == 0) {
        if (strcmp(url, "/health") == 0) {
            if (req->data) free(req->data);
            free(req);
            *con_cls = NULL;
            return handle_health(connection);
        } else if (strncmp(url, "/favorites", 10) == 0) {
            /* Extract user_id from query string */
            int user_id = 0;
            const char *query = MHD_lookup_connection_value(connection, MHD_GET_ARGUMENT_KIND, "user_id");
            if (query) {
                user_id = atoi(query);
            }
            if (req->data) free(req->data);
            free(req);
            *con_cls = NULL;
            return handle_favorites_get(connection, user_id);
        }
    } else if (strcmp(method, "POST") == 0) {
        char *body = (req->data && req->size > 0) ? req->data : NULL;
        int ret;
        
        if (strcmp(url, "/recipes") == 0) {
            ret = handle_recipes(connection, body ? body : "{}");
            if (req->data) free(req->data);
            free(req);
            *con_cls = NULL;
            return ret;
        } else if (strcmp(url, "/register") == 0) {
            ret = handle_register(connection, body ? body : "{}");
            if (req->data) free(req->data);
            free(req);
            *con_cls = NULL;
            return ret;
        } else if (strcmp(url, "/login") == 0) {
            ret = handle_login(connection, body ? body : "{}");
            if (req->data) free(req->data);
            free(req);
            *con_cls = NULL;
            return ret;
        } else if (strcmp(url, "/favorites/add") == 0) {
            ret = handle_favorites_add(connection, body ? body : "{}");
            if (req->data) free(req->data);
            free(req);
            *con_cls = NULL;
            return ret;
        }
    }
    
    /* 404 Not Found */
    char *err = create_json_response("error", "Not Found");
    struct MHD_Response *response = MHD_create_response_from_buffer(
        strlen(err), err, MHD_RESPMEM_MUST_FREE);
    MHD_add_response_header(response, "Content-Type", "application/json");
    MHD_add_response_header(response, "Access-Control-Allow-Origin", "*");
    int ret = MHD_queue_response(connection, MHD_HTTP_NOT_FOUND, response);
    MHD_destroy_response(response);
    if (req->data) free(req->data);
    free(req);
    *con_cls = NULL;
    return ret;
}

int main(int argc, char **argv) {
    unsigned int port = DEFAULT_PORT;
    
    if (argc > 1) {
        port = (unsigned int)atoi(argv[1]);
    }
    
    /* Initialize database */
    if (init_database() != 0) {
        fprintf(stderr, "Failed to initialize database\n");
        return 1;
    }
    
    /* Initialize cURL */
    curl_global_init(CURL_GLOBAL_DEFAULT);
    
    /* Start HTTP server */
    struct MHD_Daemon *daemon;
    daemon = MHD_start_daemon(MHD_USE_SELECT_INTERNALLY, port, NULL, NULL,
                             &answer_to_connection, NULL, MHD_OPTION_END);
    
    if (!daemon) {
        fprintf(stderr, "Failed to start server on port %u\n", port);
        sqlite3_close(db);
        curl_global_cleanup();
        return 1;
    }
    
    printf("Server running on port %u\n", port);
    printf("Press Ctrl+C to stop\n");
    
    getchar();
    
    MHD_stop_daemon(daemon);
    sqlite3_close(db);
    curl_global_cleanup();
    
    return 0;
}

