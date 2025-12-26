CREATE TABLE cars (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  color TEXT,
  year INTEGER
);

INSERT INTO cars (brand, model, color, year) VALUES ('Volvo', 'V60', 'Red', 2018);
INSERT INTO cars (brand, model, color, year) VALUES ('Tesla', 'Model 3', 'Silver', 2022);

SELECT * FROM cars;