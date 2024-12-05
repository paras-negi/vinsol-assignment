export function handleDropdownClick(id1, id2) {
  const dropdownHeader = document.getElementById(id1 || "dependencyDropdown");
  const dropdownContent = document.getElementById(id2 || "dependencyList");


  dropdownHeader.addEventListener("click", function () {
    dropdownContent.classList.toggle("hidden");
  });
}

export function handleOutsideClick(id1, id2) {
  const dropdownHeader = document.getElementById(id1 || "dependencyDropdown");
  const dropdownContent = document.getElementById(id2 || "dependencyList");

  document.addEventListener("click", function (event) {
    if (
      !dropdownHeader.contains(event.target) &&
      !dropdownContent.contains(event.target)
    ) {
      dropdownContent.classList.add("hidden");
    }
  });
}
