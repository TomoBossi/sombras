const form = document.getElementById("contributionForm");
const base64Input = document.getElementById("base64");
const statusText = document.getElementById("statusText");
const contributionsDiv = document.getElementById("contributions");

getContributions();

document.getElementById("customFileButton").addEventListener("click", () => {
  document.getElementById("fileInput").click();
});

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const image = document.getElementById("fileInput").files[0];
  const name = form.name.value;
  const email = form.email.value;
  const message = form.message.value;

  statusText.textContent = "Enviando...";

  if (image) {
    if (!["image/jpeg", "image/png"].includes(image.type)) {
      alert("Error: el archivo debe ser una imagen en alguno de los formatos soportados");
      statusText.textContent = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(",")[1]; // remove prefix
      processAndSubmit(form, name, email, message, base64);
    };
    reader.onerror = () => {
      alert("Error al leer el archivo");
      statusText.textContent = "";
    };
    reader.readAsDataURL(image); // triggers onload
  } else {
    processAndSubmit(form, name, email, message);
  }
});

function processAndSubmit(form, name, email, message, base64="") {
  const formData = new URLSearchParams();
  formData.append("name", name);
  formData.append("email", email);
  formData.append("message", message);
  if (base64) formData.append("base64", base64);
  fetch(form.action, {
    method: "POST",
    body: formData
  })
  .then(res => res.json())
  .then(data => {
    statusText.textContent = data.text;
    if (data.status === 200) {
      form.reset();
      getContributions(true);
    }
    document.getElementById("fileName").textContent = "...";
  })
  .catch(err => {
    console.error(err);
    statusText.textContent = "Error al enviar";
  });
}

function getContributions(submitted=false) {
  contributionsDiv.innerHTML = "Cargando...";
  fetch("https://script.google.com/macros/s/AKfycbyig4U_VSt_aEZ42UO3zCdvUxs59FiA6bdUhCU6o7rfV2dzy2WnjOvmIc4ppqn2iVYTyA/exec")
    .then(response => response.json())
    .then(contributions => {
      contributionsDiv.innerHTML = submitted ? "<p>Tu aporte va a aparecer acá cuando sea aprobado :)</p>" : "";
      if (!contributions.length && !submitted) {
        contributionsDiv.innerHTML = "<p>Soyez le premier</p>";
        return;
      }

      contributions.forEach(msg => {
        const messageElement = document.createElement("div");
        messageElement.className = "message";

        const headerDiv = document.createElement("div");
        headerDiv.className = "message-header";

        const nameStrong = document.createElement("strong");
        nameStrong.className = "message-name";
        nameStrong.textContent = DOMPurify.sanitize(msg.name) || "---";

        const dateSpan = document.createElement("span");
        dateSpan.className = "message-date";
        dateSpan.textContent = msg.date;

        headerDiv.appendChild(nameStrong);
        headerDiv.appendChild(dateSpan);

        const emailEm = document.createElement("em");
        emailEm.className = "message-email";
        emailEm.textContent = DOMPurify.sanitize(msg.email) || "---";

        const messageP = document.createElement("p");
        messageP.className = "message-text";
        messageP.textContent = DOMPurify.sanitize(msg.message) || "---";

        messageElement.appendChild(headerDiv);
        messageElement.appendChild(emailEm);
        messageElement.appendChild(messageP);

        if (msg.imageUrl) {
          const imageTag = document.createElement("img");
          imageTag.src = `https://drive.google.com/thumbnail?id=${msg.imageUrl.split("/").slice(-2, -1)[0]}&sz=w1000`;
          messageElement.appendChild(imageTag);
        }

        if (msg.reply) {
          const hr = document.createElement("hr");
          hr.className = "dark-hr";
          const reply = document.createElement("span");
          reply.className = "message-text";
          const arrow = document.createElement("strong");
          arrow.className = "reply-arrow";
          arrow.textContent = "> ";
          reply.appendChild(arrow);
          reply.append(msg.reply);
          messageElement.appendChild(hr);
          messageElement.appendChild(reply);
        }

        contributionsDiv.appendChild(messageElement);
      });
    })
    .catch(err => {
      contributionsDiv.innerHTML = "<p>Error al cargar los aportes</p>";
      console.error(err);
    });
}

document.getElementById("fileInput").addEventListener("change", function(event) {
  const fileName = event.target.files[0] ? event.target.files[0].name : "...";
  document.getElementById("fileName").textContent = fileName;
});
