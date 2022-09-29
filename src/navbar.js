import { setMsg, addClass, getJwtToken, HOST } from './helper.js';
import {
  drawCreateUserForm,
  drawDeleteUserForm,
  drawChangeFirmPictureForm,
  checkAdmin,
} from './admin.js';
import { socket } from './socket.js';

main();

async function main() {
  setNavbar();
  profileButton();
}

async function setNavbar() {
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

  if (response.error) {
    window.location.href = `${window.location.origin}/index.html`;
    return setMsg(response.error, 'error');
  }

  const userinfo = document.querySelector('#userInfo h2');

  userinfo.innerText = response.data.name;

  userinfo.email = response.data.email;
  userinfo.created_at = response.data.created_at;
  userinfo.picture = response.data.picture;

  const footerOptions = document.querySelector('.footer-options');

  if (response.data.role === -1) {
    const adminButton = document.createElement('span');
    adminButton.innerText = 'admin_panel_settings';

    adminButton.setAttribute('class', 'material-symbols-outlined');
    adminButton.setAttribute('id', 'adminButton');

    adminButton.addEventListener('click', async () => {
      const isAdmin = await checkAdmin();
      if (!isAdmin) return setMsg(response.error, 'error');

      //highlight profile button
      const footerOptions = document.querySelector('.footer-options');
      for (let option of footerOptions.children) {
        option.classList.remove('on');
      }

      adminButton.classList.add('on');

      drawCreateUserForm();
      drawDeleteUserForm();
      drawChangeFirmPictureForm();
    });

    footerOptions.insertAdjacentElement('afterbegin', adminButton);
  }

  const profile = document.getElementById('profile');

  profile.name = response.data.name;
  profile.email = response.data.email;
  profile.created_at = response.data.created_at.replace('T', ' ').slice(0, 16);
  profile.picture = response.data.picture;

  profile.addEventListener('click', drawProfile);
}

function profileButton() {
  const profile = document.getElementById('profile');

  profile.addEventListener('click', drawProfile);
}

async function drawProfile(e) {
  //highlight profile button
  const footerOptions = document.querySelector('.footer-options');
  for (let option of footerOptions.children) {
    option.classList.remove('on');
  }

  e.target.classList.add('on');

  //draw profile pane
  const pane = document.querySelector('#pane');
  const profileDiv = document.createElement('div');
  const header = document.createElement('h3');
  const profile = document.createElement('div');
  const pictureDiv = document.createElement('div');
  const infoDiv = document.createElement('div');
  const editDiv = document.createElement('div');
  const namePTag = document.createElement('p');
  const emailPTag = document.createElement('p');
  const onboardDatePTag = document.createElement('p');
  const changePasswordButton = document.createElement('button');
  const changeProfileImageButton = document.createElement('button');

  pane.innerHTML = '';

  header.innerText = 'Profile';
  namePTag.innerText = e.target.name;
  emailPTag.innerText = e.target.email;
  onboardDatePTag.innerText = e.target.created_at;
  changePasswordButton.innerText = 'Change Password';
  changeProfileImageButton.innerText = 'Edit Profile Picture';

  profileDiv.setAttribute('id', 'profileDiv');
  profile.setAttribute('id', 'profileContainer');
  pictureDiv.setAttribute('id', 'profilePictureDiv');
  editDiv.setAttribute('class', 'editDiv');
  changePasswordButton.setAttribute('id', 'changePasswordButton');
  changePasswordButton.setAttribute('class', 'on');
  changeProfileImageButton.setAttribute('id', 'changeProfileImageButton');

  const userId = localStorage.getItem('id');
  pictureDiv.style.backgroundImage = `url(${window.location.origin}/profile_picture/${userId}.jpg)`;

  addClass('profile', profileDiv, header, profile, namePTag, emailPTag);

  pane.appendChild(profileDiv);

  profileDiv.appendChild(profile);
  profile.appendChild(header);
  profile.appendChild(pictureDiv);
  profile.appendChild(infoDiv);
  profile.appendChild(editDiv);

  infoDiv.appendChild(namePTag);
  infoDiv.appendChild(emailPTag);
  infoDiv.appendChild(onboardDatePTag);

  editDiv.appendChild(changeProfileImageButton);
  editDiv.appendChild(changePasswordButton);

  changeProfileImageButton.addEventListener('click', drawChangeProfilePictureForm);
  changePasswordButton.addEventListener('click', drawChangPasswordForm);

  drawChangPasswordForm();
}

async function uploadProfilePicture(e) {
  e.preventDefault();

  const pictureInput = document.getElementById('pictureInput');

  const authorization = getJwtToken();

  const api = `${HOST}/1.0/user/picture`;
  const formData = new FormData();

  formData.append('images', pictureInput.files[0]);

  //let user know the request is sent
  const pane = document.getElementById('pane');
  const loading = document.createElement('div');
  loading.setAttribute('id', 'loadingEffect');
  pane.appendChild(loading);

  const res = await fetch(api, {
    method: 'POST',
    headers: {
      'Authorization': authorization,
    },
    body: formData,
  });

  const response = await res.json();

  //let user we got the response
  loading.remove();

  if (response.error) return setMsg(response.error, 'error');

  //show updated user pfp for current user
  const reader = new FileReader();
  reader.readAsDataURL(pictureInput.files[0]);

  reader.addEventListener('load', () => {
    const pictureDiv = document.getElementById('profilePictureDiv');
    pictureDiv.style.backgroundImage = `url(${reader.result})`;
  });

  //show updated user pfp for other user
  setTimeout(() => {
    const userId = localStorage.getItem('id');
    socket.emit('changeProfilePicture', userId);
  }, 2000);

  setMsg(response.data);
}

function previewProfilePicture() {
  const pictureInput = document.getElementById('pictureInput');

  const picture = pictureInput.files[0];
  const reader = new FileReader();

  if (picture) {
    reader.readAsDataURL(picture);
  }

  reader.addEventListener(
    'load',
    () => {
      const previewDiv = document.getElementById('profilePicturePreviewDiv');
      previewDiv.style.backgroundImage = `url(${reader.result})`;
    },
    false
  );
}

function drawChangPasswordForm(e) {
  let changePasswordDiv = document.querySelector('#changePasswordDiv');
  if (changePasswordDiv) return;

  const changeProfileImageButton = document.getElementById('changeProfileImageButton');
  changeProfileImageButton.classList.remove('on');

  const changePasswordButton = document.getElementById('changePasswordButton');
  changePasswordButton.classList.add('on');

  changePasswordDiv = document.createElement('form');

  const profileDiv = document.querySelector('#profileDiv');
  const oldPasswordPtag = document.createElement('p');
  const newPasswordPTag = document.createElement('p');
  const confirmPTag = document.createElement('p');
  const oldPasswordInput = document.createElement('input');
  const newPasswordInput = document.createElement('input');
  const confirmInput = document.createElement('input');
  const editDiv = document.createElement('div');
  const confirmButton = document.createElement('button');

  changePasswordDiv.setAttribute('id', 'changePasswordDiv');
  editDiv.setAttribute('class', 'editDiv');

  oldPasswordPtag.innerText = 'Current Password';
  newPasswordPTag.innerText = 'New Password';
  confirmPTag.innerText = 'Confirm';
  confirmButton.innerText = 'Change';

  oldPasswordInput.setAttribute('type', 'password');
  newPasswordInput.setAttribute('type', 'password');
  confirmInput.setAttribute('type', 'password');

  addClass('profile', confirmButton, oldPasswordInput, newPasswordInput, confirmInput);

  changePasswordDiv.appendChild(oldPasswordPtag);
  changePasswordDiv.appendChild(oldPasswordInput);
  changePasswordDiv.appendChild(newPasswordPTag);
  changePasswordDiv.appendChild(newPasswordInput);
  changePasswordDiv.appendChild(confirmPTag);
  changePasswordDiv.appendChild(confirmInput);
  changePasswordDiv.appendChild(editDiv);
  editDiv.appendChild(confirmButton);

  confirmButton.addEventListener('click', async e => {
    e.preventDefault();

    const authorization = getJwtToken();

    const api = `${HOST}/1.0/user`;

    const payload = {
      oldPassword: oldPasswordInput.value,
      newPassword: newPasswordInput.value,
      confirm: confirmInput.value,
    };

    const res = await fetch(api, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization,
      },
      body: JSON.stringify(payload),
    });

    const response = await res.json();

    if (response.error) return setMsg(response.error, 'error');

    setMsg(response.data);
  });

  const changeProfilePictureDiv = document.querySelector('#changeProfilePictureDiv');
  if (!changeProfilePictureDiv) return profileDiv.appendChild(changePasswordDiv);

  changeProfilePictureDiv.replaceWith(changePasswordDiv);
}

function drawChangeProfilePictureForm(e) {
  let changeProfilePictureDiv = document.querySelector('#changeProfilePictureDiv');
  if (changeProfilePictureDiv) return;

  changeProfilePictureDiv = document.createElement('form');

  const changePasswordButton = document.getElementById('changePasswordButton');
  changePasswordButton.classList.remove('on');

  const changeProfileImageButton = document.getElementById('changeProfileImageButton');
  changeProfileImageButton.classList.add('on');

  const changePasswordDiv = document.querySelector('#changePasswordDiv');
  changePasswordDiv.replaceWith(changeProfilePictureDiv);

  const previewPtag = document.createElement('p');
  const previewDiv = document.createElement('div');
  const pictureInputWrapper = document.createElement('label');
  const pictureInputIcon = document.createElement('span');
  const pictureInput = document.createElement('input');
  const editDiv = document.createElement('div');
  const confirmButton = document.createElement('span');

  changeProfilePictureDiv.setAttribute('id', 'changeProfilePictureDiv');
  previewDiv.setAttribute('id', 'profilePicturePreviewDiv');

  pictureInput.setAttribute('id', 'pictureInput');
  pictureInput.setAttribute('type', 'file');
  pictureInput.setAttribute('accept', 'image/*');
  confirmButton.setAttribute('id', 'pictureInputComfirm');

  editDiv.setAttribute('class', 'editDiv');

  pictureInputWrapper.setAttribute('id', 'pictureInputWrapper');
  pictureInputIcon.setAttribute('id', 'pictureInputIcon');
  pictureInputIcon.setAttribute('class', 'material-symbols-outlined');
  confirmButton.setAttribute('class', 'material-symbols-outlined');

  addClass('profile', confirmButton, previewPtag, previewDiv, pictureInput);
  addClass('profile', confirmButton);

  previewPtag.innerText = 'Preview';
  pictureInputIcon.innerText = 'add_photo_alternate';
  confirmButton.innerText = 'check_box';

  changeProfilePictureDiv.appendChild(previewPtag);
  changeProfilePictureDiv.appendChild(previewDiv);
  changeProfilePictureDiv.appendChild(editDiv);

  editDiv.appendChild(pictureInputWrapper);
  editDiv.appendChild(confirmButton);

  pictureInputWrapper.appendChild(pictureInput);
  pictureInputWrapper.appendChild(pictureInputIcon);

  pictureInput.addEventListener('change', previewProfilePicture);

  confirmButton.addEventListener('click', uploadProfilePicture);
}
