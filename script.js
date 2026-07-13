const nodes = document.querySelectorAll(".map-node");
const detailTag = document.querySelector("#map-detail-tag");
const detailTitle = document.querySelector("#map-detail-title");
const detailText = document.querySelector("#map-detail-text");

nodes.forEach((node) => {
  node.addEventListener("click", () => {
    nodes.forEach((item) => item.classList.remove("is-active"));
    node.classList.add("is-active");
    detailTag.textContent = node.dataset.tag;
    detailTitle.textContent = node.dataset.title;
    detailText.textContent = node.dataset.text;
  });
});

document.querySelector("#year").textContent = new Date().getFullYear();
