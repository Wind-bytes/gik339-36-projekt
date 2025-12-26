DROP TABLE IF EXISTS cars;

CREATE TABLE cars (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    color TEXT,
    year INTEGER
);

INSERT INTO cars (brand, model, color, year) VALUES ('Volvo', 'V60', 'Blue', 2020);