import { addClass, storeUserData, HOST } from './helper.js';

drawSignInForm();

function drawSignInForm() {
  const container = document.querySelector('.container');
  const signInDiv = container.querySelector('div');
  const header = document.createElement('h3');
  const form = document.createElement('form');
  const organizationNamePTag = document.createElement('p');
  const emailPTag = document.createElement('p');
  const passwordPtag = document.createElement('p');
  const organizationNameInput = document.createElement('input');
  const emailInput = document.createElement('input');
  const passwordInput = document.createElement('input');
  const button = document.createElement('button');
  const buttonIcon = document.createElement('span');

  header.innerText = 'Sign In';
  organizationNamePTag.innerText = 'Firm';
  emailPTag.innerText = 'Email';
  passwordPtag.innerText = 'Password';
  buttonIcon.innerText = 'arrow_forward';

  form.setAttribute('id', 'signIn');

  passwordInput.setAttribute('type', 'password');
  buttonIcon.setAttribute('id', 'signInIcon');
  buttonIcon.setAttribute('class', 'material-symbols-outlined');
  organizationNameInput.setAttribute('id', 'organizationNameInput');

  //default account for testing convenience
  organizationNameInput.value = 'kuoandhsu';
  emailInput.value = 'morton@kh.com';
  passwordInput.value = '1234';

  addClass(
    'auth',
    signInDiv,
    header,
    form,
    emailPTag,
    passwordPtag,
    emailInput,
    passwordInput,
    button
  );

  const signInApi = `${HOST}/1.0/user/signin`;

  button.addEventListener('click', async e => {
    e.preventDefault();

    const payload = {
      organizationName: organizationNameInput.value,
      email: emailInput.value,
      password: passwordInput.value,
    };

    const res = await fetch(signInApi, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const response = await res.json();

    if (response.error) return setSystemMessage(response.error, 'error');

    storeUserData(response.data);

    window.location.href = `${window.location.origin}/main.html`;
  });

  container.appendChild(signInDiv);
  signInDiv.appendChild(form);
  form.appendChild(header);
  form.appendChild(organizationNamePTag);
  form.appendChild(organizationNameInput);
  form.appendChild(emailPTag);
  form.appendChild(emailInput);
  form.appendChild(passwordPtag);
  form.appendChild(passwordInput);
  form.appendChild(button);
  button.appendChild(buttonIcon);
}

function setSystemMessage(messages, type, autoRemove = true) {
  const container = document.querySelector('#signIn');

  const msgDiv = document.createElement('div');
  msgDiv.setAttribute('id', 'systemMsg');

  if (Array.isArray(messages)) {
    messages.forEach(message => {
      const msg = document.createElement('p');
      msg.innerText = `${message.param}: ${message.msg}`;
      msgDiv.appendChild(msg);
    });
  } else {
    const msg = document.createElement('p');
    msg.innerText = messages;
    msgDiv.appendChild(msg);
  }

  if (type === 'error') {
    addClass('error', msgDiv);
  }

  container.insertAdjacentElement('afterbegin', msgDiv);

  if (autoRemove) {
    setTimeout(() => {
      msgDiv.remove();
    }, 4000);
  }
}
