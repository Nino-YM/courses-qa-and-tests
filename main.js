const btn = document.getElementById("demo-btn");
const msg = document.getElementById("msg");

if (btn && msg) {
  btn.addEventListener("click", () => {
    msg.textContent = "Clicked!";
  });
}
