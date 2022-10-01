import {
  setMsg,
  addClass,
  getJwtToken,
  setMessage,
  fetchGet,
  checkSpecialCharacter,
  HOST,
} from './helper.js';
import { socket } from './socket.js';
import { addChatListenerToContactDivs, addGroupChatListenerToGroupDivs } from './chat.js';
import { groupTour } from './tour.js';

async function drawSidebar() {
  drawFirmPicture();

  const contacts = await getContacts();

  const allContactsDiv = document.querySelector(`#all .contacts`);
  const starContactsDiv = document.querySelector(`#star .contacts`);
  const groupsDiv = document.querySelector(`.groups`);

  allContactsDiv.innerHTML = '';
  starContactsDiv.innerHTML = '';
  groupsDiv.innerHTML = '';

  drawContactDivs(contacts, 'all');
  addChatListenerToContactDivs(allContactsDiv);

  const starContacts = await getStarContacts();
  drawContactDivs(starContacts, 'star');
  addChatListenerToContactDivs(starContactsDiv);

  drawAddStarButton(contacts, starContacts);
  drawDeleteStarButton(starContacts);

  const groups = await getGroups();
  drawGroups(groups);
  setParticipantsInfoToGroup(groups);
  addGroupChatListenerToGroupDivs(groupsDiv);
  drawDeleteGroupButton(groups);

  collapseSidebar();

  //join groups channel that current user belongs to
  socket.emit('join', groups);

  //join firm public channel
  const firmId = localStorage.getItem('oid');
  socket.emit('joinFirm', firmId);

  listenToChatWindow();

  groupAddParticipantsButton();
  signOutButton();

  //if user is at chat window, renew the socket id of chat window
  const chatWindow = document.querySelector('#messages');
  if (chatWindow) {
    const contactDiv = document.querySelector(`.contact[data-id="${chatWindow.dataset.id}"]`);
    chatWindow.dataset.socketId = contactDiv.dataset.socketId;
  }
}

async function drawAddStarButton(contacts, starContacts) {
  if (!contacts) return;

  const contactIds = contacts.map(contact => contact.id);
  const starIds = starContacts.reduce((acc, star) => {
    acc[star.id] = 1;
    return acc;
  }, {});

  contactIds.forEach(contactId => {
    //if current contact is a star , return
    if (starIds[contactId]) return;

    const contactDiv = document.querySelector(`.contact[data-id="${contactId}"]`);
    const addStarButton = document.createElement('span');

    addStarButton.setAttribute('class', 'contact-add-star-button');
    addStarButton.classList.add('material-symbols-outlined');
    contactDiv.appendChild(addStarButton);

    addStarButton.innerText = 'star';

    addStarButton.addEventListener('click', e => {
      socket.emit('createStarContact', contactId);
      addStarButton.remove();
    });
  });
}

async function drawDeleteStarButton(starContacts) {
  const starIds = starContacts.map(star => star.id);

  starIds.forEach(starId => {
    const contactDiv = document.querySelector(`#star .contact[data-id="${starId}"]`);
    const deleteStarButton = document.createElement('span');

    deleteStarButton.setAttribute('class', 'contact-delete-star-button');
    deleteStarButton.classList.add('material-symbols-outlined');
    contactDiv.appendChild(deleteStarButton);

    deleteStarButton.innerText = 'delete';

    deleteStarButton.addEventListener('click', e => {
      socket.emit('deleteStarContact', starId);
      contactDiv.remove();
    });
  });
}

async function drawDeleteGroupButton(groups) {
  const groupIds = groups.map(group => group.id);

  groupIds.forEach(groupId => {
    const groupDiv = document.querySelector(`.group[data-socket-id="${groupId}"]`);
    const deleteStarButton = document.createElement('span');

    deleteStarButton.setAttribute('class', 'group-delete-button');
    deleteStarButton.classList.add('material-symbols-outlined');
    groupDiv.appendChild(deleteStarButton);

    deleteStarButton.innerText = 'delete';

    deleteStarButton.addEventListener('click', async e => {
      let authorization = getJwtToken();

      const api = `${HOST}/1.0/group/leave`;

      const payload = {
        groupName: groupDiv.dataset.name,
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

      //remove current user's group div
      groupDiv.remove();

      //remove group member's group div
      const userId = localStorage.getItem('id');
      if (groupDiv.dataset.hostId === userId) socket.emit('deleteGroupDiv', null, groupId);

      //if current user is at group chat window, redirect to welcome page
      const messages = document.getElementById('messages');
      if (!messages || messages.dataset.socketId !== groupId) return;

      const pane = document.getElementById('pane');
      const welcome = document.createElement('h1');

      welcome.innerText = 'Welcome Aboard';

      pane.innerHTML = '';
      pane.appendChild(welcome);

      return setMsg(response.data);
    });
  });
}

async function getContacts() {
  const response = await fetchGet('/contact');
  return response;
}

async function getStarContacts() {
  const response = await fetchGet('/contact/star');
  return response;
}

async function getGroups() {
  const response = await fetchGet('/group');
  return response;
}

function drawContactDivs(contacts, category) {
  const contactsDiv = document.querySelector(`#${category} .contacts`);

  if (!contacts) return;

  for (let contact of contacts) {
    const contactDiv = document.createElement('div');
    const pictureDiv = document.createElement('div');
    const statusDiv = document.createElement('div');
    const infoDiv = document.createElement('div');
    const nameDiv = document.createElement('div');
    const emailDiv = document.createElement('div');
    const unreadCountDiv = document.createElement('div');

    addClass('contact', contactDiv);
    addClass('contact-picture', pictureDiv);
    addClass('contact-status', statusDiv);
    addClass('contact-info', infoDiv);
    addClass('contact-unread-count', unreadCountDiv);

    //get picture from s3
    pictureDiv.style.backgroundImage = `url(${window.location.origin}/profile_picture/${contact.id}.jpg)`;
    nameDiv.innerText = contact.name;

    if (contact.unread) {
      unreadCountDiv.innerText = contact.unread;
      unreadCountDiv.classList.add('on');
    }

    contactDiv.setAttribute('data-id', contact.id);
    if (contact.socket_id === undefined || null) contact.socket_id = '';
    contactDiv.setAttribute('data-socket-id', contact.socket_id);
    contactDiv.setAttribute('title', contact.email);

    if (contact.socket_id) statusDiv.classList.add('on');

    contactDiv.appendChild(statusDiv);
    contactDiv.appendChild(pictureDiv);
    contactDiv.appendChild(infoDiv);
    contactDiv.appendChild(unreadCountDiv);
    infoDiv.appendChild(nameDiv);
    infoDiv.appendChild(emailDiv);

    contactsDiv.appendChild(contactDiv);
  }
}

function drawGroups(groups) {
  const groupsDiv = document.querySelector(`.groups`);

  for (let group of groups) {
    const groupDiv = document.createElement('div');
    const pictureDiv = document.createElement('div');
    const statusDiv = document.createElement('div');
    const nameDiv = document.createElement('div');
    const unreadCountDiv = document.createElement('div');

    addClass('group', groupDiv);
    addClass('group-picture', pictureDiv);
    addClass('group-status', statusDiv);
    addClass('group-name', nameDiv);
    addClass('group-unread-count', unreadCountDiv);

    if (group.name > 15) nameDiv.innerText = group.name.slice(0, 15) + '...';
    else nameDiv.innerText = group.name;

    groupDiv.setAttribute('title', 'Name: ' + group.name);

    if (group.unread) {
      unreadCountDiv.innerText = group.unread;
      unreadCountDiv.classList.add('on');
    }

    groupDiv.setAttribute('data-socket-id', group.id);
    groupDiv.setAttribute('data-name', group.name);
    groupDiv.setAttribute('data-host-id', group.host);

    groupsDiv.appendChild(groupDiv);
    groupDiv.appendChild(statusDiv);
    groupDiv.appendChild(pictureDiv);
    groupDiv.appendChild(nameDiv);
    groupDiv.appendChild(unreadCountDiv);
  }
}

async function setParticipantsInfoToGroup(groups) {
  let authorization = getJwtToken();

  for (let group of groups) {
    console.log('Group Name: ' + group.name);

    const api = `${HOST}/1.0/group/participants?groupName=${group.name}`;

    const res = await fetch(api, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization,
      },
    });

    const response = await res.json();

    if (response.error) return setMsg(response.error, 'error');

    const groupDiv = document.querySelector(`[data-socket-id="${group.id}"]`);

    let titleAttribute = '';
    for (let user of response) {
      titleAttribute += `${user.name} - ${user.email}\n`;
    }

    const lastLineBreak = titleAttribute.lastIndexOf('\n');
    titleAttribute = titleAttribute.slice(0, lastLineBreak);

    const currentTitleAttributeValue = groupDiv.getAttribute('title');

    console.log('currentTitle: ' + currentTitleAttributeValue);
    groupDiv.setAttribute('title', `${currentTitleAttributeValue}\n${titleAttribute}`);
  }
}

function groupAddParticipantsButton() {
  const groupAddParticipants = document.getElementById('groupAddParticipants');

  groupAddParticipants.addEventListener('click', e => {
    drawCreateGroupForm(e);
    drawAddAndDeleteParticipantsForm();
    addEmailInputLitener();

    //introduction for group page
    groupTour();
  });
}

function drawCreateGroupForm(e) {
  //highlight profile button
  const footerOptions = document.querySelector('.footer-options');
  for (let option of footerOptions.children) {
    option.classList.remove('on');
  }

  e.target.classList.add('on');

  const pane = document.querySelector('#pane');
  const manageDiv = document.createElement('div');
  const formDiv = document.createElement('div');
  const infoDiv = document.createElement('div');
  const header = document.createElement('h3');
  const createForm = document.createElement('form');
  const namePTag = document.createElement('p');

  const nameInput = document.createElement('input');

  const button = document.createElement('button');

  pane.innerHTML = '';

  header.innerText = 'Create Group';
  namePTag.innerText = 'Name';

  button.innerText = 'Create';

  manageDiv.setAttribute('id', 'manageDiv');
  formDiv.setAttribute('id', 'formDiv');
  infoDiv.setAttribute('id', 'infoDiv');

  addClass('group-function', infoDiv, header, createForm, namePTag, nameInput, button);

  const api = `${HOST}/1.0/group`;

  button.addEventListener('click', async e => {
    e.preventDefault();

    const isNormalCharacter = checkSpecialCharacter(nameInput.value);

    if (!isNormalCharacter) return setMsg(`no < > & ' " / in group name`, 'error');

    const payload = {
      name: nameInput.value,
    };

    let authorization = getJwtToken();

    const res = await fetch(api, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authorization,
      },
      body: JSON.stringify(payload),
    });

    const response = await res.json();

    if (response.error) return setMsg(response.error, 'error');

    const userId = localStorage.getItem('id');

    const newGroup = [
      {
        id: response.group.id,
        name: nameInput.value,
        host: userId,
        unread: 0,
      },
    ];

    drawGroups(newGroup);

    const username = localStorage.getItem('name');
    const userEmail = localStorage.getItem('email');

    const newGroupDiv = document.querySelector(`[data-socket-id="${response.group.id}"]`);
    const titleAttribute = `${username} - ${userEmail}`;
    newGroupDiv.setAttribute('title', titleAttribute);

    socket.emit('join', newGroup);

    drawDeleteGroupButton(newGroup);

    return setMsg(response.data);
  });

  pane.appendChild(manageDiv);
  manageDiv.appendChild(formDiv);
  manageDiv.appendChild(infoDiv);
  formDiv.appendChild(createForm);
  createForm.appendChild(header);
  createForm.appendChild(namePTag);
  createForm.appendChild(nameInput);

  createForm.appendChild(button);
}

function drawAddAndDeleteParticipantsForm() {
  //provide search users result in add group participants page
  //every time user enter into this page, reset selectedUser
  window.selectedUser = {};

  const pane = document.querySelector('#pane');
  const formDiv = pane.querySelector('#formDiv');
  const infoDiv = pane.querySelector('#infoDiv');
  const header = document.createElement('h3');
  const form = document.createElement('form');
  const groupNamePtag = document.createElement('p');
  const groupNameInput = document.createElement('input');
  const participantsPtag = document.createElement('p');
  const participantsInput = document.createElement('input');
  const searchResultDiv = document.createElement('div');
  const selectedUserDiv = document.createElement('div');
  const searchResultPtag = document.createElement('h3');
  const selectedUserPtag = document.createElement('h3');
  const buttonsDiv = document.createElement('div');
  const addButton = document.createElement('button');
  const deleteButton = document.createElement('button');

  header.innerText = 'Manage member';

  groupNamePtag.innerText = 'Group Name';
  participantsPtag.innerText = 'Search User';

  participantsInput.setAttribute('placeholder', 'attorney@email.com');
  participantsInput.setAttribute('id', 'groupParticipantsSearchEmailInput');
  searchResultDiv.setAttribute('id', 'groupParticipantsSearchResultDiv');
  selectedUserDiv.setAttribute('id', 'groupSelectedUserDiv');

  addButton.innerText = 'Add';
  deleteButton.innerText = 'Delete';

  searchResultPtag.innerText = 'Search Result';
  selectedUserPtag.innerText = 'Selected';

  addClass(
    'group-function',
    header,
    form,
    groupNamePtag,
    groupNameInput,
    participantsPtag,
    participantsInput,
    addButton,
    deleteButton
  );

  const api = `${HOST}/1.0/group`;

  addButton.addEventListener('click', async e => {
    e.preventDefault();

    if (!groupNameInput.value) return setMsg('Please enter group name', 'error');

    const userIds = Object.keys(window.selectedUser);

    if (userIds.length === 0) return setMsg('Please select at least one participant', 'error');

    const payload = {
      groupName: groupNameInput.value,
      userIds,
      updateType: 1,
    };

    let authorization = getJwtToken();

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

    const currentUserId = localStorage.getItem('id');

    socket.emit('drawGroupDiv', userIds, currentUserId, response.group.id, groupNameInput.value);

    window.selectedUser = {};
    groupNameInput.value = '';
    participantsInput.value = '';
    searchResultDiv.innerHTML = '';
    selectedUserDiv.innerHTML = '';

    return setMsg(response.data);
  });

  deleteButton.addEventListener('click', async e => {
    e.preventDefault();

    if (!groupNameInput.value) return setMsg('Please enter group name', 'error');

    const userIds = Object.keys(window.selectedUser);

    if (userIds.length === 0) return setMsg('Please select at least one participant', 'error');

    const payload = {
      groupName: groupNameInput.value,
      userIds,
      updateType: 0,
    };

    let authorization = getJwtToken();

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

    socket.emit('deleteGroupDiv', userIds, response.group.id);

    window.selectedUser = {};
    groupNameInput.value = '';
    participantsInput.value = '';
    searchResultDiv.innerHTML = '';
    selectedUserDiv.innerHTML = '';

    return setMsg(response.data);
  });

  formDiv.appendChild(form);

  form.appendChild(header);
  form.appendChild(groupNamePtag);
  form.appendChild(groupNameInput);
  form.appendChild(participantsPtag);
  form.appendChild(participantsInput);
  form.appendChild(buttonsDiv);
  buttonsDiv.appendChild(addButton);
  buttonsDiv.appendChild(deleteButton);

  infoDiv.appendChild(searchResultPtag);
  infoDiv.appendChild(searchResultDiv);
  infoDiv.appendChild(selectedUserPtag);
  infoDiv.appendChild(selectedUserDiv);
}

function addEmailInputLitener() {
  const input = document.getElementById('groupParticipantsSearchEmailInput');

  const debouncedDetectInput = debounce(detectInput, 600);

  input.addEventListener('keydown', debouncedDetectInput);
}

function debounce(func, delay) {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);

    timer = setTimeout(() => {
      func.apply(null, args);
    }, delay);
  };
}

async function detectInput(e) {
  const currentInput = e.target.value;
  const suggestionsList = document.getElementById('groupParticipantsSearchResultDiv');

  if (!currentInput) return (suggestionsList.innerHTML = '');

  socket.emit('searchEamil', currentInput);
}

//Check whether current user is at chat window. If yes, highlight chatting contact div.
function listenToChatWindow() {
  const pane = document.getElementById('pane');

  const observer = new MutationObserver(function (mutations) {
    const sideBar = document.getElementById('sidebar');
    const allContactDivs = document.querySelectorAll('.contact');
    const allGroupDivs = document.querySelectorAll('.group');
    const footerOptions = document.querySelectorAll('.footer-options span');

    allContactDivs.forEach(contactDiv => {
      contactDiv.classList.remove('on');
    });

    allGroupDivs.forEach(groupDiv => {
      groupDiv.classList.remove('on');
    });

    const messages = document.getElementById('messages');
    if (!messages) return;

    //remove highlight from footer button
    footerOptions.forEach(button => {
      button.classList.remove('on');
    });

    //group
    if (messages.dataset.id === 'undefined') {
      const groupDiv = sideBar.querySelector(`[data-socket-id="${messages.dataset.socketId}"]`);
      groupDiv.classList.add('on');

      return;
    }

    const contactUserId = messages.dataset.id;

    const currentContactDivs = sideBar.querySelectorAll(`[data-id="${contactUserId}"]`);

    currentContactDivs.forEach(div => {
      div.classList.add('on');
    });
  });

  observer.observe(pane, {
    childList: true,
    subtree: true,
  });
}

function collapseSidebar() {
  const headers = document.querySelectorAll('.header');

  for (let header of headers) {
    header.addEventListener('click', e => {
      const actives = document.querySelectorAll('.active');

      if (actives.length !== 0) {
        for (let active of actives) {
          active.classList.remove('active');
          active.parentElement.nextElementSibling.setAttribute('style', 'height: 0');
        }
      }

      //get current block root
      let headerParent = e.target;
      while (!headerParent.classList.contains('collapse-header')) {
        headerParent = headerParent.parentElement;
      }

      //get content div
      const content = headerParent.querySelector('.content');

      content.setAttribute('style', 'height: ' + 57 + 'vh');

      const symbol = headerParent.querySelector('.collapse-symbol');
      symbol.classList.toggle('active');
    });

    if (header.dataset.expanded === 'true') {
      header.click();
    }
  }
}

function signOutButton() {
  const signOutButton = document.getElementById('signOut');

  signOutButton.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = `${window.location.origin}/index.html`;
  });
}

function drawFirmPicture() {
  const logoDiv = document.getElementById('firmLogo');
  const organizationId = localStorage.getItem('oid');
  logoDiv.style.backgroundImage = `url(${window.location.origin}/firm_picture/${organizationId}.jpg)`;
}

export { drawContactDivs, drawSidebar, drawGroups, drawDeleteGroupButton };
