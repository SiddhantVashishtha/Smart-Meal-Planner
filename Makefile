CC = gcc
CFLAGS = -Wall -Wextra -std=c11 -O2
LDFLAGS = -lmicrohttpd -lcurl -lsqlite3 -lcjson

TARGET = server
SOURCES = server.c

all: $(TARGET)

$(TARGET): $(SOURCES)
	$(CC) $(CFLAGS) -o $(TARGET) $(SOURCES) $(LDFLAGS)

clean:
	rm -f $(TARGET) mealplanner.db

run: $(TARGET)
	./$(TARGET)

.PHONY: all clean run

