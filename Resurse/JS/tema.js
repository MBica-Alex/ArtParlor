let savedTheme = localStorage.getItem("tema");
if (savedTheme && savedTheme !== "light") {
    document.body.classList.add(savedTheme);
}