(function (document) {
  var p_segmented_controls = document.querySelectorAll(".p-segmented-controls a");
  for (var item of p_segmented_controls) {
    item.addEventListener("click", function (event) {
      event.preventDefault();
      this.parentElement.querySelector("a.active").classList.remove("active");
      this.classList.add("active");
    });
  }

})(document)