const Modal = (config) => {
	return new Promise((resolve, reject) => {
		let modal_id = "p_" + generateId(20);
		console.log("Popup", modal_id);
		const raw_html = `
				<div class="modal_bg_curtain" id="${modal_id}">
					<div class="modal_popup">
						<div class="modal_title">
							${config.title || "Prompt"}
						</div>
						<div class="modal_text">
							${config.content || "Do you agree ?"}
						</div>
						<div class="popup_form">
							${config.closeButton ? `<button class="popup_close">Close</button>` : ""}
							<button class="accept_button">${config.buttonText || "Continue"}</button>
						</div>
					</div>
				</div>
			`;
		document.body.insertAdjacentHTML("beforeend", raw_html);
		document
			.querySelector(`#${modal_id} div.modal_popup div.popup_form button.accept_button`)
			.addEventListener("click", (e) => {
				let response = {};
				let error = false;
				document.querySelectorAll(`#${modal_id} .modal_text input`).forEach((i) => {
					console.log(i.value.trim().length);
					if (i.type == "text" && (i.value.trim().length < 4 || i.value.trim().length > 20)) {
						i.classList.add("error");
						error = true;
						return;
					}
					response[i.name] = {
						value: i.value,
					};
				});
				if (error == true) return;
				resolve(Object.keys(response).length !== 0 ? response : { error: "No input" });
				hide(modal_id);
			});
		if (config.closeButton) {
			document
				.querySelector(`#${modal_id} div.modal_popup div.popup_form button.popup_close`)
				.addEventListener("click", (e) => {
					reject({
						error: "Rejected",
					});
					hide(modal_id);
				});
		}
		function hide(id) {
			document.body.removeChild(document.querySelector(`#${id}`));
		}
	});
};

// dec2hex :: Integer -> String
// i.e. 0-255 -> '00'-'ff'
const dec2hex = (dec) => {
	return dec.toString(16).padStart(2, "0");
};

// generateId :: Integer -> String
const generateId = (len) => {
	var arr = new Uint8Array((len || 40) / 2);
	window.crypto.getRandomValues(arr);
	return Array.from(arr, dec2hex).join("");
};
