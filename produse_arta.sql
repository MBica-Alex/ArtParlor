DROP TABLE IF EXISTS produse CASCADE;
DROP TYPE IF EXISTS tip_produs_arta CASCADE;
DROP TYPE IF EXISTS categ_prod_arta CASCADE;

CREATE TYPE tip_produs_arta AS ENUM('pictura', 'desen', 'sculptura');
CREATE TYPE categ_prod_arta AS ENUM('pentru_incepatori', 'profesional', 'hobby', 'pentru_copii', 'editie_limitata', 'set_complet');

CREATE TABLE produse (
   id serial PRIMARY KEY,
   nume VARCHAR(100) UNIQUE NOT NULL,
   descriere TEXT,
   imagine VARCHAR(300),
   tip_produs tip_produs_arta DEFAULT 'pictura',
   categorie categ_prod_arta DEFAULT 'hobby',
   pret NUMERIC(8,2) NOT NULL,
   greutate INT NOT NULL CHECK (greutate >= 0),
   data_adaugare TIMESTAMP DEFAULT current_timestamp,
   culoare VARCHAR(50),
   materiale VARCHAR(300),
   sigur_pentru_copii BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO produse (nume, descriere, imagine, tip_produs, categorie, pret, greutate, culoare, materiale, sigur_pentru_copii) VALUES 
('Set 12 pensule sintetice', 'Set complet de pensule cu păr sintetic, ideale pentru acrilic și acuarelă.', 'pensule.jpg', 'pictura', 'set_complet', 45.50, 150, 'multicolor', 'lemn, plastic, par sintetic', true),
('Culori acrilice 500ml', 'Vopsea acrilică la cantitate mare, uscare rapidă și acoperire excelentă.', 'acrilice.png', 'pictura', 'profesional', 60.00, 550, 'albastru', 'vopsea acrilica, recipient plastic', false),
('Bloc de desen A3', 'Bloc de desen cu hârtie groasă de 200g/mp, textură fină.', 'bloc-desen.jpg', 'desen', 'hobby', 35.00, 800, 'alb', 'hartie', true),
('Lut cu uscare la aer', 'Lut maleabil care se usucă fără coacere, ideal pentru mici sculpturi.', 'lut.jpg', 'sculptura', 'pentru_copii', 25.00, 1000, 'gri', 'lut', true),
('Set creioane grafit 12B-2H', 'Creioane de la duritate foarte moale la tare, perfecte pentru schițe.', 'creioane.png', 'desen', 'pentru_incepatori', 28.90, 200, 'negru', 'lemn, grafit', true),
('Trusă acuarele 24 culori', 'Acuarele fine cu pigment intens, cutie metalică.', 'acuarele.png', 'pictura', 'editie_limitata', 120.00, 350, 'multicolor', 'pigment, guma arabica, metal', true),
('Daltă pentru sculptură în lemn', 'Daltă ascuțită manual, oțel de înaltă calitate.', 'dalta.png', 'sculptura', 'profesional', 85.00, 180, 'argintiu', 'otel, lemn de nuc', false),
('Șevalet de studio', 'Șevalet robust din lemn de fag, ajustabil pe înălțime.', 'sevalet.jpg', 'pictura', 'profesional', 450.00, 5000, 'natur', 'lemn de fag, elemente metalice', true),
('Pastă de modelaj 500g', 'Pastă ușoară pentru modelat figurine, ușor de pictat după uscare.', 'pasta-modelaj.jpg', 'sculptura', 'pentru_incepatori', 15.00, 500, 'alb', 'polimeri, celuloza', true),
('Paletă de culori ovală', 'Paletă clasică din lemn pentru amestecul culorilor de ulei.', 'paleta.png', 'pictura', 'hobby', 30.00, 150, 'natur', 'lemn stratificat', true),
('Set markere alcool 48 culori', 'Markere profesionale pe bază de alcool cu două capete.', 'markere.png', 'desen', 'set_complet', 250.00, 1200, 'multicolor', 'plastic, cerneala, alcool', false),
('Cărbune presat set 6', 'Batoane de cărbune presat pentru umbre profunde.', 'carbune.png', 'desen', 'profesional', 18.50, 100, 'negru', 'carbune, liant', true),
('Ulei de in sicativat 100ml', 'Diluant pentru culori în ulei care accelerează uscarea.', 'ulei.jpg', 'pictura', 'profesional', 22.00, 120, 'galben', 'ulei de in, compusi chimici', false),
('Plastilină 10 culori', 'Plastilină non-toxică care nu se usucă la aer, perfectă pentru școală.', 'plastilina.jpg', 'sculptura', 'pentru_copii', 12.00, 250, 'multicolor', 'ceara, pigmenti non-toxici', true),
('Pânză pe șasiu 50x70', 'Pânză de bumbac 100%, grunduită de 3 ori, gata de pictură.', 'panza.jpg', 'pictura', 'hobby', 40.00, 600, 'alb', 'bumbac, lemn de brad, gesso', true),
('Set pixuri cu gel', 'Pixuri cu gel metalizat pentru detalii fine pe desene.', 'pixuri.jpg', 'desen', 'pentru_copii', 20.00, 150, 'multicolor', 'plastic, cerneala tip gel', true),
('Sârmă pentru armătură', 'Sârmă flexibilă de aluminiu pentru structura de rezistență a sculpturilor.', 'sarma.jpg', 'sculptura', 'profesional', 35.00, 200, 'argintiu', 'aluminiu', true);