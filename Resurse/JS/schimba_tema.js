window.addEventListener("DOMContentLoaded", function () {
    let selectTema = document.getElementById("select-tema");
    if (selectTema) {
        let savedTheme = localStorage.getItem("tema") || "light";
        selectTema.value = savedTheme;

        selectTema.onchange = function () {
            let theme = this.value;
            document.body.classList.remove("dark", "nature");
            if (theme !== "light") {
                document.body.classList.add(theme);
            }
            localStorage.setItem("tema", theme);
        }
    }
});