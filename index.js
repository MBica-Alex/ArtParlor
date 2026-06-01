const express = require("express");
const path = require("path");
const fs = require("fs");
const sass = require("sass");
const sharp = require("sharp");
const pg = require("pg");

app = express();
app.set("view engine", "ejs")

obGlobal = {
    obErori: null,
    obImagini: null,
    folderScss: path.join(__dirname, "Resurse/scss"),
    folderCss: path.join(__dirname, "Resurse/css"),
    folderBackup: path.join(__dirname, "backup"),
}

console.log("Folder index.js", __dirname);
console.log("Folder curent (de lucru)", process.cwd());
console.log("Cale fisier", __filename);

client = new pg.Client({
    database: "cti_2026",
    user: "mihai",
    password: "mihai",
    host: "localhost",
    port: 5432
})

client.connect()

client.query("select * from unnest(enum_range(null::tip_produs_arta))", function (err, rez) {
    if (err) {
        console.log("Eroare", err)
    }
    else {
        app.locals.optiuni_meniu = rez.rows;
    }
})

let vect_foldere = ["temp", "logs", "backup", "fisiere_uploadate"]
for (let folder of vect_foldere) {
    let caleFolder = path.join(__dirname, folder);
    if (!fs.existsSync(caleFolder)) {
        fs.mkdirSync(path.join(caleFolder), { recursive: true });
    }
}

app.use("/Resurse", express.static(path.join(__dirname, "Resurse")));
app.use("/dist", express.static(path.join(__dirname, "/node_modules/bootstrap/dist")));

function initImagini() {
    var continut = fs.readFileSync(path.join(__dirname, "resurse/json/galerie.json")).toString("utf-8");

    obGlobal.obImagini = JSON.parse(continut);
    let vImagini = obGlobal.obImagini.imagini;
    let caleGalerie = obGlobal.obImagini.cale_galerie

    let caleAbs = path.join(__dirname, caleGalerie);
    let caleAbsMediu = path.join(caleAbs, "mediu");
    fs.mkdirSync(caleAbs, { recursive: true });
    fs.mkdirSync(caleAbsMediu, { recursive: true });

    for (let imag of vImagini) {
        if (!imag.fisier_imagine) continue;
        let parsed = path.parse(imag.fisier_imagine);
        let numeFis = parsed.name;
        let ext = parsed.ext;
        let caleFisAbs = path.join(caleAbs, imag.fisier_imagine);
        if (!fs.existsSync(caleFisAbs)) {
            console.warn(`Imaginea ${caleFisAbs} nu exista. Se sare peste.`);
            continue;
        }
        let caleFisMediuAbs = path.join(caleAbsMediu, numeFis + ".webp");
        sharp(caleFisAbs).resize(300).toFile(caleFisMediuAbs);
        imag.fisier_mediu = path.join("/", caleGalerie, "mediu", numeFis + ".webp")
        imag.fisier_imagine = path.join("/", caleGalerie, imag.fisier_imagine)
    }
}

function verificaJSONImagini() {
    let caleJson = path.join(__dirname, "resurse/json/galerie.json");
    if (!fs.existsSync(caleJson)) return;

    let continut = fs.readFileSync(caleJson, "utf8");
    let obj = JSON.parse(continut);
    let caleAbs = path.join(__dirname, obj.cale_galerie);

    if (!fs.existsSync(caleAbs)) {
        console.error(`Eroare de configurare (JSON Galerie): Folderul specificat în "cale_galerie" ("${obj.cale_galerie}") nu există în sistemul de fișiere. Vă rugăm să vă asigurați că acest folder este creat.`);
    } else {
        for (let img of obj.imagini) {
            if (!img.fisier_imagine) continue;
            let caleImg = path.join(caleAbs, img.fisier_imagine);
            if (!fs.existsSync(caleImg)) {
                console.error(`Eroare de configurare (JSON Galerie): Fișierul imagine "${img.fisier_imagine}" definit în lista de imagini nu a fost găsit în folderul "${obj.cale_galerie}". Verificați dacă fișierul lipsește sau numele este greșit.`);
            }
        }
    }
}
verificaJSONImagini();

initImagini();

function compileazaScss(caleScss, caleCss) {
    if (!caleCss) {
        let parsed = path.parse(caleScss);
        let numeFis = parsed.name;
        caleCss = numeFis + ".css";
    }

    if (!path.isAbsolute(caleScss))
        caleScss = path.join(obGlobal.folderScss, caleScss)
    if (!path.isAbsolute(caleCss))
        caleCss = path.join(obGlobal.folderCss, caleCss)

    let caleBackup = path.join(obGlobal.folderBackup, "resurse/css");
    if (!fs.existsSync(caleBackup)) {
        fs.mkdirSync(caleBackup, { recursive: true })
    }

    let numeFisCss = path.basename(caleCss);
    if (fs.existsSync(caleCss)) {
        try {
            let parsedCss = path.parse(numeFisCss);
            let timestamp = new Date().getTime();
            let numeFisNou = `${parsedCss.name}_${timestamp}${parsedCss.ext}`;
            fs.copyFileSync(caleCss, path.join(caleBackup, numeFisNou));
        } catch (err) {
            console.error("Eroare la salvarea fișierului în backup:", err.message);
        }
    }

    try {
        let rez = sass.compile(caleScss, { "sourceMap": true });
        fs.writeFileSync(caleCss, rez.css);
    } catch (err) {
        console.error("Eroare la compilarea SCSS:", err.message);
    }
}

vFisiere = fs.readdirSync(obGlobal.folderScss);
for (let numeFis of vFisiere) {
    if (path.extname(numeFis) == ".scss") {
        compileazaScss(numeFis);
    }
}

fs.watch(obGlobal.folderScss, function (eveniment, numeFis) {
    if (eveniment == "change" || eveniment == "rename") {
        let caleCompleta = path.join(obGlobal.folderScss, numeFis);
        if (fs.existsSync(caleCompleta)) {
            compileazaScss(caleCompleta);
        }
    }
})


app.get("/favicon.ico", function (req, res) {
    res.sendFile(path.join(__dirname, "resurse/imagini/favicon/favicon.ico"))
});


app.get(["/", "/index", "/home"], function (req, res) {
    let nrImagini = Math.floor(Math.random() * 4) * 2 + 6;

    let indexZile = { "luni": 1, "marti": 2, "miercuri": 3, "joi": 4, "vineri": 5, "sambata": 6, "duminica": 7 };
    let ziuaCurentaIdx = new Date().getDay();
    if (ziuaCurentaIdx === 0) ziuaCurentaIdx = 7;

    let imaginiValide = obGlobal.obImagini.imagini.filter(imag => {
        if (!imag.intervale_zile) return false;
        for (let interval of imag.intervale_zile) {
            let start = indexZile[interval[0]];
            let end = indexZile[interval[1]];
            if (start <= end && ziuaCurentaIdx >= start && ziuaCurentaIdx <= end) return true;
            if (start > end && (ziuaCurentaIdx >= start || ziuaCurentaIdx <= end)) return true;
        }
        return false;
    });

    imaginiValide.sort(() => 0.5 - Math.random());
    let imaginiAnimatie = imaginiValide.slice(0, nrImagini);

    if (imaginiAnimatie.length % 2 !== 0 && imaginiAnimatie.length > 0) {
        imaginiAnimatie.pop();
    }
    if (imaginiAnimatie.length === 0) {
        imaginiAnimatie = [];
    }

    let caleScss = path.join(__dirname, "Resurse/scss/galerie_dinamica.scss");
    let caleCss = path.join(__dirname, "Resurse/css/galerie_dinamica.css");

    if (fs.existsSync(caleScss)) {
        let continutScss = `$nr-imagini: ${imaginiAnimatie.length > 0 ? imaginiAnimatie.length : 1};\n` + fs.readFileSync(caleScss, "utf-8");
        try {
            let rez = sass.compileString(continutScss);
            fs.writeFileSync(caleCss, rez.css);
        } catch (err) {
            console.error("Eroare la compilarea SCSS galerie dinamica:", err.message);
        }
    }

    res.render("Pagini/index", {
        ip: req.ip,
        imagini: obGlobal.obImagini.imagini,
        imaginiAnimatie: imaginiAnimatie
    });
});

app.get("/galerie", function (req, res) {
    res.render("Pagini/galerie", {
        imagini: obGlobal.obImagini.imagini
    });
});

app.get("/produse", function (req, res) {
    let clauzaWhere = ""
    if (req.query.tip)
        clauzaWhere = `where tip_produs='${req.query.tip}'`
    client.query(`select * from produse ${clauzaWhere}`, function (err, rez) {
        if (err) {
            console.log("Eroare", err)
            afisareEroare(res, 2)
        }
        else {
            client.query("select * from unnest(enum_range(null::categ_prod_arta))", function (err, rezOptiuni) {
                if (err) {
                    afisareEroare(res, 2)
                }
                else {
                    let minPret = 0;
                    let maxPret = 0;
                    let culoriDinDb = [];
                    if (rez.rows.length > 0) {
                        minPret = rez.rows[0].pret;
                        maxPret = rez.rows[0].pret;
                        for (let prod of rez.rows) {
                            if (prod.pret < minPret) minPret = prod.pret;
                            if (prod.pret > maxPret) maxPret = prod.pret;
                            if (prod.culoare) {
                                let c = prod.culoare.toLowerCase();
                                if (!culoriDinDb.includes(c)) {
                                    culoriDinDb.push(c);
                                }
                            }
                        }
                    }
                    if (minPret === maxPret) maxPret = minPret + 100; // prevent empty range
                    
                    res.render("pagini/produse", {
                        produse: rez.rows,
                        optiuni: rezOptiuni.rows,
                        minPret: minPret,
                        maxPret: maxPret,
                        culoriDinDb: culoriDinDb
                    })
                }
            })
        }
    })
})

app.get("/produs/:id", function (req, res) {

    client.query(`select * from produse where id=${req.params.id}`, function (err, rez) {
        if (err) {
            console.log("Eroare", err)
            afisareEroare(res, 2)
        }
        else {
            if (rez.rowCount == 0) {
                afisareEroare(res, 404, "Produs inexistent")
            }
            else {
                res.render("pagini/produs", {
                    prod: rez.rows[0]
                })
            }
        }
    })
})

app.get("/cale", function (req, res) {
    console.log("Am primit o cerere GET pe /cale");
    res.send("Raspuns la <b style = 'color: red;'>cererea</b> GET pe /cale");
});

app.get("/cale2/:a/:b", function (req, res) {
    res.send(parseInt(req.params.a) + parseInt(req.params.b));
});

function verificareErori() {
    let caleFisier = path.join(__dirname, "Resurse", "JSON", "erori.json");
    if (!fs.existsSync(caleFisier)) {
        console.error("Eroare JSON: Nu exista fisierul erori.json. Aplicatia se inchide.");
        process.exit();
    }
    let continut = fs.readFileSync(caleFisier, "utf8");

    let stack = [];
    let currentKeys = new Set();
    let regex = /"([^"]+)"\s*:|\{|\}/g;
    let match;
    while ((match = regex.exec(continut)) !== null) {
        if (match[0] === '{') {
            stack.push(currentKeys);
            currentKeys = new Set();
        } else if (match[0] === '}') {
            currentKeys = stack.pop();
        } else if (match[1]) {
            if (currentKeys.has(match[1])) {
                console.error(`Eroare JSON: Proprietatea '${match[1]}' este specificata de mai multe ori in acelasi obiect.`);
            }
            currentKeys.add(match[1]);
        }
    }

    let erori;
    try {
        erori = JSON.parse(continut);
    } catch (e) {
        console.error("Eroare parsare JSON:", e);
        return;
    }

    if (!erori.info_erori || !erori.cale_baza || !erori.eroare_default) {
        console.error("Eroare JSON: Lipseste una dintre proprietatile esentiale: info_erori, cale_baza, eroare_default.");
    }

    if (erori.eroare_default) {
        if (!erori.eroare_default.titlu || !erori.eroare_default.text || !erori.eroare_default.imagine) {
            console.error("Eroare JSON: Pentru eroarea default lipseste una dintre proprietatile: titlu, text sau imagine.");
        }
    }

    if (erori.cale_baza) {
        let caleFolderBaza = path.join(__dirname, erori.cale_baza);
        if (!fs.existsSync(caleFolderBaza)) {
            console.error(`Eroare JSON: Folderul specificat in "cale_baza" (${erori.cale_baza}) nu exista in sistemul de fisiere.`);
        } else {
            if (erori.eroare_default && erori.eroare_default.imagine) {
                let imgP = path.join(caleFolderBaza, erori.eroare_default.imagine);
                if (!fs.existsSync(imgP)) {
                    console.error(`Eroare JSON: Imaginea default '${erori.eroare_default.imagine}' nu exista.`);
                }
            }
            if (erori.info_erori) {
                for (let err of erori.info_erori) {
                    if (err.imagine) {
                        let imgP = path.join(caleFolderBaza, err.imagine);
                        if (!fs.existsSync(imgP)) {
                            console.error(`Eroare JSON: Imaginea '${err.imagine}' pentru identificatorul ${err.identificator} nu exista.`);
                        }
                    }
                }
            }
        }
    }

    if (erori.info_erori) {
        let cntId = {};
        for (let err of erori.info_erori) {
            if (err.identificator !== undefined) cntId[err.identificator] = (cntId[err.identificator] || 0) + 1;
        }
        for (let err of erori.info_erori) {
            if (err.identificator !== undefined && cntId[err.identificator] > 1) {
                let det = Object.assign({}, err);
                delete det.identificator;
                console.error(`Eroare JSON: Exista mai multe erori cu identificatorul ${err.identificator}. Restul proprietatilor: ${JSON.stringify(det)}`);
            }
        }
    }
}
verificareErori();

function initErori() {
    let continut = fs.readFileSync(path.join(__dirname, "resurse/json/erori.json")).toString("utf-8");
    let erori = obGlobal.obErori = JSON.parse(continut)
    let err_default = erori.eroare_default
    err_default.imagine = path.join(erori.cale_baza, err_default.imagine)
    for (let eroare of erori.info_erori) {
        eroare.imagine = path.join(erori.cale_baza, eroare.imagine)
    }

}
initErori()

function afisareEroare(res, identificator, titlu, text, imagine) {
    let eroare = obGlobal.obErori.info_erori.find((elem) =>
        elem.identificator == identificator
    )
    let errDefault = obGlobal.obErori.eroare_default;
    if (eroare?.status)
        res.status(eroare.identificator)
    res.render("pagini/eroare", {
        imagine: imagine || eroare?.imagine || errDefault.imagine,
        titlu: titlu || eroare?.titlu || errDefault.titlu,
        text: text || eroare?.text || errDefault.text,
    });
}

app.get("/eroare", function (req, res) {
    afisareEroare(res, 404, "Titlu!!!")
});

app.get("/*pagina", function (req, res) {
    console.log("Cale pagina", req.url);
    if (req.url.startsWith("/resurse") && path.extname(req.url) == "") {
        afisareEroare(res, 403);
        return;
    }
    if (path.extname(req.url) == ".ejs") {
        afisareEroare(res, 400);
        return;
    }
    try {
        res.render("pagini" + req.url, function (err, rezRandare) {
            if (err) {
                if (err.message.includes("Failed to lookup view")) {
                    afisareEroare(res, 404)
                }
                else {
                    afisareEroare(res);
                }
            }
            else {
                res.send(rezRandare);
                console.log("Rezultat randare", rezRandare);
            }
        });
    }
    catch (err) {
        if (err.message.includes("Cannot find module")) {
            afisareEroare(res, 404)
        }
        else {
            afisareEroare(res);
        }
    }
});

app.listen(8080);
console.log("Serverul a pornit!");