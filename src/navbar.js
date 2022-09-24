import { setMsg, addClass, getJwtToken, HOST } from './helper.js';
import { drawCreateUserForm, drawDeleteUserForm, checkAdmin } from './admin.js';

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

      drawCreateUserForm();
      drawDeleteUserForm();
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
  const pane = document.querySelector('#pane');
  const profileDiv = document.createElement('div');
  const header = document.createElement('h3');
  const profile = document.createElement('div');
  const pictureDiv = document.createElement('div');
  const picture = document.createElement('img');
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
  picture.src = e.target.picture;
  onboardDatePTag.innerText = e.target.created_at;
  changePasswordButton.innerText = 'Change Password';
  changeProfileImageButton.innerText = 'Edit Profile Picture';

  profileDiv.setAttribute('id', 'profileDiv');
  profile.setAttribute('id', 'profileContainer');
  editDiv.setAttribute('class', 'editDiv');

  addClass('profile', profileDiv, header, profile, namePTag, emailPTag);

  pane.appendChild(profileDiv);

  profileDiv.appendChild(profile);
  profile.appendChild(header);
  profile.appendChild(pictureDiv);
  profile.appendChild(infoDiv);
  profile.appendChild(editDiv);

  pictureDiv.appendChild(picture);

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

  formData.append('images', pictureInput.file);

  console.log('Going to upload this: ', pictureInput);

  const res = await fetch(api, {
    method: 'POST',
    headers: {
      'Authorization': authorization,
    },
    body: formData,
  });

  const response = await res.json();

  if (response.error) return setMsg(response.error, 'error');

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

  const changePasswordDiv = document.querySelector('#changePasswordDiv');
  changePasswordDiv.replaceWith(changeProfilePictureDiv);

  const previewPtag = document.createElement('p');
  const previewDiv = document.createElement('div');
  const pictureInput = document.createElement('input');
  const editDiv = document.createElement('div');
  const confirmButton = document.createElement('button');

  changeProfilePictureDiv.setAttribute('id', 'changeProfilePictureDiv');
  previewDiv.setAttribute('id', 'profilePicturePreviewDiv');
  pictureInput.setAttribute('id', 'pictureInput');
  pictureInput.setAttribute('type', 'file');
  editDiv.setAttribute('class', 'editDiv');

  addClass('profile', confirmButton, previewPtag, previewDiv, pictureInput);

  previewPtag.innerText = 'Preview';

  confirmButton.innerText = 'Change';

  addClass('profile', confirmButton);

  changeProfilePictureDiv.appendChild(previewPtag);
  changeProfilePictureDiv.appendChild(previewDiv);
  changeProfilePictureDiv.appendChild(pictureInput);
  changeProfilePictureDiv.appendChild(editDiv);

  editDiv.appendChild(pictureInput);
  editDiv.appendChild(confirmButton);

  pictureInput.addEventListener('change', previewProfilePicture);

  confirmButton.addEventListener('click', uploadProfilePicture);
}
