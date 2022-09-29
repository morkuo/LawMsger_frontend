import { HOST, setMsg, addClass, loadingEffect, getJwtToken } from './helper.js';
import { socket } from './socket.js';

function drawCreateUserForm() {
  const pane = document.querySelector('#pane');
  const signUpDiv = document.createElement('div');
  const header = document.createElement('h3');
  const form = document.createElement('form');
  const namePTag = document.createElement('p');
  const emailPTag = document.createElement('p');
  const passwordPtag = document.createElement('p');
  const nameInput = document.createElement('input');
  const emailInput = document.createElement('input');
  const passwordInput = document.createElement('input');
  const button = document.createElement('button');

  pane.innerHTML = '';

  header.innerText = 'Create User';
  namePTag.innerText = 'Name';
  emailPTag.innerText = 'Email';
  passwordPtag.innerText = 'Password';
  button.innerText = 'Create';

  passwordInput.setAttribute('type', 'password');

  addClass(
    'admin',
    signUpDiv,
    header,
    form,
    namePTag,
    emailPTag,
    passwordPtag,
    nameInput,
    emailInput,
    passwordInput,
    button
  );

  const signUpApi = `${HOST}/1.0/user`;

  button.addEventListener('click', async e => {
    e.preventDefault();

    const payload = {
      name: nameInput.value,
      email: emailInput.value,
      password: passwordInput.value,
    };

    let authorization = getJwtToken();

    const res = await fetch(signUpApi, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization,
      },
      body: JSON.stringify(payload),
    });

    const response = await res.json();

    if (response.error) return setMsg(response.error, 'error');

    return setMsg(response.data);
  });

  pane.appendChild(signUpDiv);
  signUpDiv.appendChild(form);
  form.appendChild(header);
  form.appendChild(namePTag);
  form.appendChild(nameInput);
  form.appendChild(emailPTag);
  form.appendChild(emailInput);
  form.appendChild(passwordPtag);
  form.appendChild(passwordInput);
  form.appendChild(button);
}

async function checkAdmin() {
  const profileApi = `${HOST}/1.0/user`;

  let authorization = getJwtToken();

  const res = await fetch(profileApi, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': authorization,
    },
  });

  const response = await res.json();

  if (response.error || response.data.role !== -1) return false;

  return true;
}

function drawDeleteUserForm() {
  const pane = document.querySelector('#pane');
  const manageDiv = pane.querySelector('div');
  const header = document.createElement('h3');
  const form = document.createElement('form');
  const emailPTag = document.createElement('p');
  const emailInput = document.createElement('input');
  const button = document.createElement('button');

  header.innerText = 'Delete User';

  emailPTag.innerText = 'Email';

  button.innerText = 'Delete';

  addClass('admin', header, form, emailPTag, emailInput, button);

  const signUpApi = `${HOST}/1.0/user`;

  button.addEventListener('click', async e => {
    e.preventDefault();

    const payload = {
      email: emailInput.value,
    };

    let authorization = getJwtToken();

    const res = await fetch(signUpApi, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization,
      },
      body: JSON.stringify(payload),
    });

    const response = await res.json();

    if (response.error) return setMsg(response.error, 'error');

    return setMsg(response.data);
  });

  manageDiv.appendChild(form);

  form.appendChild(header);
  form.appendChild(emailPTag);
  form.appendChild(emailInput);
  form.appendChild(button);
}

function drawChangeFirmPictureForm() {
  const pane = document.querySelector('#pane');
  const manageDiv = pane.querySelector('div');

  const changePictureDiv = document.createElement('form');
  const firmPictureHeader = document.createElement('h3');
  const previewDiv = document.createElement('div');
  const pictureInputWrapper = document.createElement('label');
  const pictureInputIcon = document.createElement('span');
  const pictureInput = document.createElement('input');
  const editDiv = document.createElement('div');
  const confirmButton = document.createElement('span');

  manageDiv.setAttribute('id', 'adminManageDiv');
  changePictureDiv.setAttribute('id', 'firmPictureDiv');
  previewDiv.setAttribute('id', 'firmPicturePreviewDiv');

  pictureInput.setAttribute('id', 'pictureInput');
  pictureInput.setAttribute('type', 'file');
  pictureInput.setAttribute('accept', 'image/*');
  confirmButton.setAttribute('id', 'firmPictureInputComfirm');
  editDiv.setAttribute('class', 'editDiv');

  pictureInputWrapper.setAttribute('id', 'pictureInputWrapper');
  pictureInputIcon.setAttribute('id', 'firmPictureInputIcon');
  pictureInputIcon.setAttribute('class', 'material-symbols-outlined');
  confirmButton.setAttribute('class', 'material-symbols-outlined');

  addClass('admin', changePictureDiv, confirmButton, firmPictureHeader, pictureInput);

  firmPictureHeader.innerText = 'Edit Logo';
  pictureInputIcon.innerText = 'add_photo_alternate';
  confirmButton.innerText = 'check_box';

  manageDiv.appendChild(changePictureDiv);

  changePictureDiv.appendChild(firmPictureHeader);
  changePictureDiv.appendChild(previewDiv);
  changePictureDiv.appendChild(editDiv);

  editDiv.appendChild(pictureInputWrapper);
  editDiv.appendChild(confirmButton);

  pictureInputWrapper.appendChild(pictureInput);
  pictureInputWrapper.appendChild(pictureInputIcon);

  pictureInput.addEventListener('change', previewFirmPicture);

  confirmButton.addEventListener('click', uploadFirmPicture);
}

function previewFirmPicture() {
  const pictureInput = document.getElementById('pictureInput');

  const picture = pictureInput.files[0];
  const reader = new FileReader();

  if (picture) {
    reader.readAsDataURL(picture);
  }

  reader.addEventListener(
    'load',
    () => {
      const previewDiv = document.getElementById('firmPicturePreviewDiv');
      previewDiv.style.backgroundImage = `url(${reader.result})`;
    },
    false
  );
}

async function uploadFirmPicture(e) {
  e.preventDefault();

  const pictureInput = document.getElementById('pictureInput');

  const authorization = getJwtToken();

  const api = `${HOST}/1.0/firm/picture`;
  const formData = new FormData();

  formData.append('images', pictureInput.files[0]);

  //let user know the request is sent
  const loadingDiv = loadingEffect();

  const res = await fetch(api, {
    method: 'POST',
    headers: {
      'Authorization': authorization,
    },
    body: formData,
  });

  const response = await res.json();

  //let user know the request is sent
  loadingDiv.remove();

  if (response.error) return setMsg(response.error, 'error');

  //show updated user pfp for current user
  const reader = new FileReader();
  reader.readAsDataURL(pictureInput.files[0]);

  reader.addEventListener('load', () => {
    const pictureDiv = document.getElementById('firmLogo');
    pictureDiv.style.backgroundImage = `url(${reader.result})`;
  });

  //show updated user pfp for other user
  setTimeout(() => {
    const firmId = localStorage.getItem('oid');
    socket.emit('changeFirmPicture', firmId);
  }, 2000);

  setMsg(response.data);
}

export { drawCreateUserForm, drawDeleteUserForm, drawChangeFirmPictureForm, checkAdmin };
