window.onload = function () {

    function levenshtein(a, b) {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;
        var matrix = [];
        for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
        for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) == a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
                }
            }
        }
        return matrix[b.length][a.length];
    }

 
    function valideazaFiltre() {
        let isValid = true;
        let inpDescriere = document.getElementById("inp-descriere");
        if (inpDescriere) {
            if (inpDescriere.value.match(/[<>\\]/)) {
                inpDescriere.classList.add("is-invalid");
                alert("Descrierea conține caractere invalide (<, >, \\)!");
                isValid = false;
            } else {
                inpDescriere.classList.remove("is-invalid");
            }
        }
        return isValid;
    }

    let inpDesc = document.getElementById("inp-descriere");
    if (inpDesc) {
        inpDesc.addEventListener('input', function () {
            if (this.value.match(/[<>\\]/)) {
                this.classList.add("is-invalid");
            } else {
                this.classList.remove("is-invalid");
            }
        });
    }


    document.getElementById("inp-pret").onchange = function () {
        let val = this.value.trim()
        document.getElementById("infoRange").innerHTML = `(${val})`
    }

    function aplicaFiltre() {
        if (!valideazaFiltre()) return;
        let inpNume = document.getElementById("inp-nume").value.trim().toLowerCase()

        let grupRadio = document.getElementsByName("gr_rad")
        let grMin, grMax, isToate = true;
        for (let rad of grupRadio) {
            if (rad.checked) {
                isToate = false;
                if (rad.value == "toate") {
                    isToate = true;
                } else {
                    let parts = rad.value.split(":");
                    grMin = parseInt(parts[0]);
                    grMax = parseInt(parts[1]);
                }
                break
            }
        }

        let inpPretMin = parseFloat(document.getElementById("inp-pret").value.trim())
        let inpCategorie = document.getElementById("inp-categorie").value.trim().toLowerCase()

        let inpCuloare = document.getElementById("inp-culoare") ? document.getElementById("inp-culoare").value.trim().toLowerCase() : "";
        let inpDescriere = document.getElementById("inp-descriere") ? document.getElementById("inp-descriere").value.trim().toLowerCase() : "";
        let inpCopii = document.getElementById("inp-copii") ? document.getElementById("inp-copii").checked : false;
        let inpTipElem = document.getElementById("inp-tip");
        let tipuriSelectate = inpTipElem ? Array.from(inpTipElem.selectedOptions).map(opt => opt.value) : [];

        let materialeFiltru = [];
        let chkMateriale = document.getElementsByClassName("chk-material");
        for (let chk of chkMateriale) {
            if (chk.checked) {
                let radioSel = document.querySelector(`input[name="rad_${chk.value}"]:checked`);
                if (radioSel) materialeFiltru.push({ nume: chk.value, are: radioSel.value === "are" });
            }
        }

        let produse = document.getElementsByClassName("produs")
        let matchCount = 0;
        for (let prod of produse) {
            prod.style.display = "none"

            let nume = prod.getElementsByClassName("val-nume")[0].innerHTML.trim().toLowerCase()
            let cond1 = nume.includes(inpNume);
            if (!cond1 && inpNume.length > 2) {
                let diffWhole = levenshtein(nume, inpNume);
                if (diffWhole <= 2) cond1 = true;
                else {
                    let words = nume.split(/[\s\-]+/);
                    for (let w of words) {
                        if (w.length >= Math.max(1, inpNume.length - 2) && levenshtein(w, inpNume) <= 2) {
                            cond1 = true;
                            break;
                        }
                    }
                }
            }

            let greutate = parseInt(prod.getElementsByClassName("val-greutate")[0].innerHTML.trim())
            let cond2 = (greutate >= grMin && greutate < grMax) || isToate;

            let pret = parseFloat(prod.getElementsByClassName("val-pret")[0].innerHTML.trim())
            let cond3 = pret >= inpPretMin

            let cond4 = prod.getElementsByClassName("val-categorie")[0].innerHTML.trim().toLowerCase() == inpCategorie || inpCategorie == "toate";

            let culoareElem = prod.getElementsByClassName("val-culoare")[0];
            let culoare = culoareElem ? culoareElem.innerHTML.trim().toLowerCase() : "";
            let condCuloare = (inpCuloare === "" || culoare.startsWith(inpCuloare));

            let descElem = prod.getElementsByClassName("val-descriere")[0];
            let descriere = descElem ? descElem.innerHTML.trim().toLowerCase() : "";
            let condDesc = (inpDescriere === "" || descriere.includes(inpDescriere));

            let tipElem = prod.getElementsByClassName("val-tip")[0];
            let tipProd = tipElem ? tipElem.innerHTML.trim().toLowerCase() : "";
            let tipProdFaraDiacritice = tipProd.normalize('NFD').replace(/[\u0300-\u036f]/g, "");
            let condTip = tipuriSelectate.length === 0 || tipuriSelectate.includes(tipProdFaraDiacritice);

            let copiiElem = prod.getElementsByClassName("val-copii")[0];
            let copii = copiiElem ? copiiElem.innerHTML.trim() === "Da" : false;
            let condCopii = !inpCopii || copii;

            let matElem = prod.getElementsByClassName("val-materiale")[0];
            let materialeProd = matElem ? matElem.innerHTML.trim().toLowerCase() : "";
            let condMateriale = true;
            for (let mf of materialeFiltru) {
                let hasMat = materialeProd.includes(mf.nume);
                if (mf.are && !hasMat) condMateriale = false;
                if (!mf.are && hasMat) condMateriale = false;
            }

            if (cond1 && cond2 && cond3 && cond4 && condCuloare && condDesc && condTip && condCopii && condMateriale) {
                prod.style.display = "block"
                matchCount++;
            }
        }

        let mesaj = document.getElementById("mesaj-nu-exista");
        if (mesaj) {
            mesaj.style.display = matchCount === 0 ? "block" : "none";
        }
    }

    document.getElementById("filtrare").onclick = aplicaFiltre;

    let filterInputs = ["inp-nume", "inp-pret", "inp-categorie", "inp-culoare", "inp-descriere", "inp-copii", "inp-tip"];
    for (let id of filterInputs) {
        let el = document.getElementById(id);
        if (el) {
            el.addEventListener("change", aplicaFiltre);
            if (el.tagName === "INPUT" && el.type === "text" || el.tagName === "TEXTAREA") {
                el.addEventListener("input", aplicaFiltre);
            }
        }
    }

    let rads = document.querySelectorAll('input[type="radio"], input[type="checkbox"]');
    for (let rad of rads) {
        rad.addEventListener("change", aplicaFiltre);
    }

    document.getElementById("resetare").onclick = function () {
        if (!confirm("Sunteți sigur că doriți resetarea filtrelor?")) return;
        document.getElementById("inp-nume").value = ""
        document.getElementById("inp-pret").value = "0"
        document.getElementById("infoRange").innerHTML = "(0)"
        document.getElementById("inp-categorie").value = "toate"
        if (document.getElementById("inp-culoare")) document.getElementById("inp-culoare").value = "";
        if (document.getElementById("inp-descriere")) document.getElementById("inp-descriere").value = "";
        if (document.getElementById("inp-copii")) document.getElementById("inp-copii").checked = false;
        let inpTip = document.getElementById("inp-tip");
        if (inpTip) for (let opt of inpTip.options) opt.selected = true;

        for (let rad of document.getElementsByName("gr_rad")) {
            rad.checked = rad.value === "toate";
        }
        let chkMateriale = document.getElementsByClassName("chk-material");
        for (let chk of chkMateriale) {
            chk.checked = false;
            let r = document.querySelector(`input[name="rad_${chk.value}"][value="are"]`);
            if (r) r.checked = true;
        }

        let produse = document.getElementsByClassName("produs")
        for (let prod of produse) {
            prod.style.display = "block"
        }
    }

    function sorteaza(semn) {
        if (!valideazaFiltre()) return;
        let produse = document.getElementsByClassName("produs")
        let vProduse = Array.from(produse)
        vProduse.sort(function (a, b) {
            let pretA = parseFloat(a.getElementsByClassName("val-pret")[0].innerHTML.trim())
            let pretB = parseFloat(b.getElementsByClassName("val-pret")[0].innerHTML.trim())
            let grA = parseFloat(a.getElementsByClassName("val-greutate")[0].innerHTML.trim())
            let grB = parseFloat(b.getElementsByClassName("val-greutate")[0].innerHTML.trim())

            let raportA = grA / pretA;
            let raportB = grB / pretB;

            if (Math.abs(raportA - raportB) < 0.0001) {
                let catA = a.getElementsByClassName("val-categorie")[0].innerHTML.trim().toLowerCase()
                let catB = b.getElementsByClassName("val-categorie")[0].innerHTML.trim().toLowerCase()
                return semn * catA.localeCompare(catB)
            }

            return semn * (raportA - raportB)
        })
        for (let prod of vProduse) {
            prod.parentElement.appendChild(prod)
        }
    }

    document.getElementById("sortCrescNume").onclick = function () { sorteaza(1) }
    document.getElementById("sortDescrescNume").onclick = function () { sorteaza(-1) }

    function calculeazaSuma() {
        if (!valideazaFiltre()) return;
        let produse = document.getElementsByClassName("produs");
        let suma = 0;
        for (let prod of produse) {
            if (prod.style.display != "none") {
                suma += parseFloat(prod.getElementsByClassName("val-pret")[0].innerHTML.trim());
            }
        }

        let infoDiv = document.getElementById("infoSumaDiv");
        if (!infoDiv) {
            infoDiv = document.createElement("div");
            infoDiv.id = "infoSumaDiv";
            infoDiv.style.position = "fixed";
            infoDiv.style.bottom = "20px";
            infoDiv.style.right = "20px";
            infoDiv.style.backgroundColor = "var(--bs-primary, #0d6efd)";
            infoDiv.style.color = "white";
            infoDiv.style.padding = "10px 20px";
            infoDiv.style.borderRadius = "8px";
            infoDiv.style.zIndex = "9999";
            infoDiv.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
            infoDiv.innerHTML = `Suma prețurilor: ${suma} RON`;
            document.body.appendChild(infoDiv);

            setTimeout(function () {
                let div1 = document.getElementById("infoSumaDiv");
                if (div1) div1.remove();
            }, 2000);
        }
        else {
            infoDiv.innerHTML = `Suma prețurilor: ${suma} RON`;
        }
    }

    let btnCalculare = document.getElementById("calculare");
    if (btnCalculare) {
        btnCalculare.onclick = calculeazaSuma;
    }

    window.onkeydown = function (e) {
        if (e.key == "c" && e.altKey) {
            calculeazaSuma();
        }
    }
}