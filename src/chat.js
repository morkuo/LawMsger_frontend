import {
  setMsg,
  getJwtToken,
  setMessage,
  scrollToBottom,
  fetchGet,
  isImage,
  HOST,
} from './helper.js';
import { socket } from './socket.js';
import { searchTour } from './tour.js';

let uploadfilesQueue = [];

function addChatListenerToContactDivs(contactsDiv) {
  /*
    Click Specific Contact then draw Chat Window
    */
  contactsDiv.addEventListener('click', chatListener);
}

function addGroupChatListenerToGroupDivs(groupsDiv) {
  /*
    Click Specific Contact then draw Chat Window
    */
  groupsDiv.addEventListener('click', groupChatListener);
}

async function chatListener(e) {
  // click on add star button, then return
  if (e.target.classList.contains('contact-add-star-button') && e.target.innerText !== '') return;
  if (e.target.classList.contains('contact-delete-star-button')) return;

  uploadfilesQueue = [];

  //look for the clicked element's user id
  let targetContact = e.target;
  while (!targetContact.hasAttribute('data-socket-id')) {
    targetContact = targetContact.parentElement;
  }

  const userId = localStorage.getItem('id');
  const userName = document.querySelector('#userInfo h2');

  //remove unread count
  const unreadCountDivs = document.querySelectorAll(
    `.contacts [data-id="${targetContact.dataset.id}"] .contact-unread-count`
  );
  unreadCountDivs.forEach(div => {
    div.innerText = '';
    div.classList.remove('on');
  });

  drawChatWindow(targetContact.dataset.id, targetContact.dataset.socketId);

  //append history message to chat window
  const { data: msgs } = await getMessages(targetContact.dataset.id);

  for (let msg of msgs) {
    setMessage(
      msg.message,
      msg.created_at,
      msg.sender_id,
      msg.files,
      msg.sender_name,
      msg.sender_id !== targetContact.dataset.id ? 'read' : msg.isRead
    );
  }

  scrollToBottom();

  moreMessagesListener(targetContact.dataset.id);

  //suggestions
  const input = document.getElementById('input');
  const form = document.getElementById('form');

  const debouncedDetectInput = debounce(detectInput, 600);

  input.addEventListener('keydown', debouncedDetectInput);

  // Send message
  form.addEventListener('submit', async e => {
    e.preventDefault();

    const messages = document.getElementById('messages');
    const contactUserSocketId = messages.dataset.socketId;
    const contactUserId = messages.dataset.id;
    const contactDiv = document.querySelector(`[data-id="${contactUserId}"]`);

    const contactNameDiv = contactDiv.querySelector('.contact-info div:first-child');
    const contactName = contactNameDiv.innerText;

    if (input.value || uploadfilesQueue.length) {
      const authorization = getJwtToken();
      const response = await uploadFile(authorization);

      if (response.error) return setMsg(response.error);

      const filesInfo = JSON.stringify(response);

      socket.emit('msg', input.value, contactUserSocketId, contactUserId, contactName, filesInfo);

      setMessage(input.value, Date.now(), userId, filesInfo, userName.innerText, 'read', 'append');

      scrollToBottom();

      input.value = '';
    }
  });
}

function moreMessagesListener(targetContactUserId) {
  const messages = document.getElementById('messages');

  messages.addEventListener(
    'scroll',
    debounce(async e => {
      // if number of messages showing on the window is less than 15, don't get more messages
      const messageSize = e.target.querySelectorAll('li').length;
      if (messageSize < 15) return;

      const currentHeight = e.target.scrollTop;
      const totalHeight = e.target.scrollHeight;
      const difference = totalHeight - currentHeight;

      const proportion = (difference / totalHeight) * 100;

      console.log('current proportion: ' + proportion);

      if (proportion > 85) {
        console.log('Pull New data');

        let oldestMessageTimeDiv = messages.querySelector('li:first-child .chat-message-time');
        let baselineTime = oldestMessageTimeDiv.dataset.rawTime;

        const { data: moreMessages } = await getMessages(targetContactUserId, baselineTime);

        if (!moreMessages.length) return setMsg('No More Messages');

        for (let msg of moreMessages) {
          setMessage(
            msg.message,
            msg.created_at,
            msg.sender_id,
            msg.files,
            msg.sender_name,
            msg.sender_id !== targetContactUserId ? 'read' : msg.isRead
          );
        }
      }
    }, 600)
  );
}

async function groupChatListener(e) {
  // click on leave button, then return
  if (e.target.classList.contains('group-delete-button')) return;

  //look for the clicked element's socket id
  let targetContact = e.target;
  while (!targetContact.hasAttribute('data-socket-id')) {
    targetContact = targetContact.parentElement;
  }

  //remove unread count
  const unreadCountDiv = targetContact.querySelector('.group-unread-count');

  unreadCountDiv.innerText = '';
  unreadCountDiv.classList.remove('on');

  drawChatWindow(targetContact.dataset.id, targetContact.dataset.socketId);

  const userId = localStorage.getItem('id');

  //append history message to chat window
  const { data: msgs } = await getGroupMessages(targetContact.dataset.socketId);

  for (let msg of msgs) {
    const contactDiv = document.querySelector(`.contacts [data-id="${msg.sender_id}"]`);

    //other users
    if (contactDiv) {
      const userId = localStorage.getItem('id');
      const isRead = msg.isRead.includes(userId);
      setMessage(msg.message, msg.created_at, msg.sender_id, msg.files, msg.sender_name, isRead);
    } else {
      setMessage(msg.message, msg.created_at, msg.sender_id, msg.files, msg.sender_name, 'read');
    }
  }

  //get more messages when scroll to top
  const messages = document.getElementById('messages');

  messages.addEventListener(
    'scroll',
    debounce(async e => {
      // if number of messages showing on the window is less than 15, don't get more messages
      const messageSize = e.target.querySelectorAll('li').length;
      if (messageSize < 15) return;

      const currentHeight = e.target.scrollTop;
      const totalHeight = e.target.scrollHeight;
      const difference = totalHeight - currentHeight;

      const proportion = (difference / totalHeight) * 100;

      console.log('current proportion: ' + proportion);

      if (proportion > 85) {
        console.log('Pull New data');

        let oldestMessageTimeDiv = messages.querySelector('li:first-child .chat-message-time');
        let baselineTime = oldestMessageTimeDiv.dataset.rawTime;

        const { data: moreMessages } = await getGroupMessages(
          targetContact.dataset.socketId,
          baselineTime
        );

        if (moreMessages.length === 0) return setMsg('No More Messages');

        for (let msg of moreMessages) {
          setMessage(
            msg.message,
            msg.created_at,
            msg.sender_id,
            msg.files,
            msg.sender_name,
            msg.sender_id === userId ? 'read' : msg.isRead,
            'read'
          );
        }
      }
    }, 600)
  );

  scrollToBottom();

  //suggestions
  const input = document.getElementById('input');
  const form = document.getElementById('form');

  const debouncedDetectInput = debounce(detectInput, 600);

  input.addEventListener('keydown', debouncedDetectInput);

  // Send message
  form.addEventListener('submit', async e => {
    e.preventDefault();

    const messages = document.getElementById('messages');
    const contactUserSocketId = messages.dataset.socketId;

    if (input.value || uploadfilesQueue.length !== 0) {
      const authorization = getJwtToken();
      const response = await uploadFile(authorization);

      if (response.error) return setMsg(response.error);

      const filesInfo = JSON.stringify(response);

      socket.emit('groupmsg', input.value, contactUserSocketId, filesInfo);

      input.value = '';
    }
  });
}

function drawChatWindow(targetContactUserId, targetContactSocketId) {
  const pane = document.getElementById('pane');
  const messages = document.createElement('ul');
  const suggestions = document.createElement('ul');
  const form = document.createElement('form');
  const inputWrapper = document.createElement('div');
  const input = document.createElement('textarea');
  const sendButtonWrapper = document.createElement('span');
  const sendButton = document.createElement('button');
  const uploadButtonWrapper = document.createElement('label');
  const uploadButtonIcon = document.createElement('span');
  const uploadButton = document.createElement('input');
  const previewImageDiv = document.createElement('div');
  const unloadButton = document.createElement('span');
  const tourButton = document.createElement('span');

  pane.innerHTML = '';

  messages.setAttribute('id', 'messages');
  messages.setAttribute('data-id', targetContactUserId);
  messages.setAttribute('data-socket-id', targetContactSocketId);
  suggestions.setAttribute('id', 'suggestions');
  form.setAttribute('id', 'form');
  inputWrapper.setAttribute('id', 'inputWrapper');
  input.setAttribute('id', 'input');
  input.setAttribute('autocomplete', 'off');

  sendButtonWrapper.innerText = 'send';
  sendButtonWrapper.setAttribute('class', 'material-symbols-outlined');
  sendButtonWrapper.setAttribute('id', 'chatSendButtonWrapper');

  uploadButtonWrapper.setAttribute('id', 'chatUploadButtonWrapper');
  uploadButtonIcon.setAttribute('class', 'material-symbols-outlined');
  uploadButton.setAttribute('id', 'chatUploadButton');
  uploadButton.setAttribute('type', 'file');
  uploadButton.setAttribute('name', 'images');
  uploadButton.setAttribute('multiple', '');
  uploadButton.style.visibility = 'hidden';
  uploadButtonIcon.innerText = 'attach_file';

  unloadButton.setAttribute('id', 'chatUnloadFileButton');
  unloadButton.setAttribute('class', 'material-symbols-outlined');
  unloadButton.innerText = 'delete';

  previewImageDiv.setAttribute('id', 'previewImageDiv');
  previewImageDiv.setAttribute('data-file', 'false');

  tourButton.setAttribute('id', 'searchTourButton');
  tourButton.setAttribute('class', 'material-symbols-outlined');
  tourButton.innerText = 'help';

  pane.appendChild(messages);
  pane.appendChild(form);
  form.appendChild(inputWrapper);

  uploadButtonWrapper.appendChild(uploadButton);
  uploadButtonWrapper.appendChild(uploadButtonIcon);
  inputWrapper.appendChild(suggestions);
  inputWrapper.appendChild(uploadButtonWrapper);
  inputWrapper.appendChild(input);
  inputWrapper.appendChild(sendButton);
  inputWrapper.appendChild(tourButton);
  sendButton.appendChild(sendButtonWrapper);

  pane.appendChild(previewImageDiv);
  previewImageDiv.appendChild(unloadButton);

  resizeTextarea();
  submitFormOnEnter();

  //resize textarea
  sendButton.addEventListener('click', () => {
    input.style.height = 0;

    //reset suggestionsList position
    const suggestionsList = document.querySelector('#suggestions');

    suggestionsList.classList.remove('on');
    suggestionsList.innerHTML = '';
    suggestionsList.style.bottom = `${inputWrapper.offsetHeight - 7}px`;
  });

  addUploadFileListener();
  addUnloadFileListener();

  //Introduction for search;
  searchTour();

  tourButton.addEventListener('click', () => {
    localStorage.removeItem('search_end');
    localStorage.removeItem('search_current_step');
    searchTour();
  });
}

function resizeTextarea() {
  const textarea = document.getElementById('input');
  textarea.addEventListener('input', resize, false);
}

function resize() {
  this.style.height = 0;

  if (this.style.height < 28) this.style.height = '28px';
  else this.style.height = this.scrollHeight + 'px';

  const suggestionsList = document.querySelector('#suggestions.on');
  const inputWrapper = document.querySelector('#inputWrapper');

  if (!suggestionsList) return;

  suggestionsList.style.bottom = `${inputWrapper.offsetHeight - 7}px`;
}

function submitFormOnEnter() {
  const textarea = document.getElementById('input');
  textarea.addEventListener('keypress', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      //send message
      e.target.form.dispatchEvent(new Event('submit', { cancelable: true }));

      //add new line to textarea
      e.preventDefault();

      //resize textarea
      textarea.style.height = 0;

      //reset suggestionsList position
      const suggestionsList = document.querySelector('#suggestions');
      const inputWrapper = document.querySelector('#inputWrapper');

      suggestionsList.style.bottom = `${inputWrapper.offsetHeight - 7}px`;
    }
  });
}

async function getMessages(targetContactUserId, baselineTime) {
  let messageApiPath = `/message`;

  if (!baselineTime) messageApiPath += `?contactUserId=${targetContactUserId}`;
  else messageApiPath += `/more?contactUserId=${targetContactUserId}&baselineTime=${baselineTime}`;

  return await fetchGet(messageApiPath);
}

async function getGroupMessages(targetGroupId, baselineTime) {
  let apiPath = `/groupmessage`;

  if (!baselineTime) apiPath += `?groupId=${targetGroupId}`;
  else apiPath += `/more?groupId=${targetGroupId}&baselineTime=${baselineTime}`;

  return await fetchGet(apiPath);
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

const paragraphMapping = {
  I: 1,
  II: 2,
  III: 3,
  IV: 4,
  V: 5,
  VI: 6,
  VII: 7,
  VIII: 8,
  IX: 9,
  X: 10,
  XI: 11,
  XII: 12,
  XIII: 13,
  XIV: 14,
  XV: 15,
};

async function detectInput(e) {
  const currentInput = e.target.value;
  const suggestionsList = document.getElementById('suggestions');
  const input = document.getElementById('input');
  const inputWrapper = document.querySelector('#inputWrapper');

  //reset suggestionsList position
  suggestionsList.style.bottom = `${inputWrapper.offsetHeight - 7}px`;

  if (!currentInput) {
    //reset all listener
    input.removeEventListener('keydown', wordKeyPressListener);
    input.removeEventListener('keypress', clauseKeyPressListener);
    input.removeEventListener('keypress', matchKeyPressListener);
    suggestionsList.removeEventListener('click', wordClickListener);
    suggestionsList.removeEventListener('click', clauseClickListener);
    suggestionsList.removeEventListener('click', matchClickListener);

    suggestionsList.innerHTML = '';
    suggestionsList.classList.remove('on');
    return;
  }

  const controlKey = [
    'CapsLock',
    'Shift',
    'Control',
    'Alt',
    'Meta',
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'Escape',
  ];

  if (controlKey.includes(e.key)) return;

  if (e.key === 'Tab') {
    e.preventDefault();
    return;
  }

  let wordSuggestion = -1;
  let clauseSuggestion = -1;
  let matchclausesContent = -1;

  const symbols = ['#', '＃', '@', '＠', '|', '｜'];
  let maxIndex = -1;

  //find last symbol index
  symbols.forEach(symbol => {
    const index = currentInput.lastIndexOf(symbol);
    if (index > maxIndex) maxIndex = index;
  });

  //no search symbol, hide suggestion list
  if (maxIndex === -1) return suggestionsList.classList.remove('on');

  //check last symbol
  if (currentInput[maxIndex] === '#' || currentInput[maxIndex] === '＃') {
    wordSuggestion = maxIndex;
  } else if (currentInput[maxIndex] === '@' || currentInput[maxIndex] === '＠') {
    clauseSuggestion = maxIndex;
  } else {
    matchclausesContent = maxIndex;
  }

  if (wordSuggestion > -1) {
    console.log('word emit');

    socket.emit('suggestion', currentInput.slice(wordSuggestion + 1));

    input.index = maxIndex;
    input.removeEventListener('keydown', clauseKeyPressListener);
    input.removeEventListener('keydown', matchKeyPressListener);
    suggestionsList.removeEventListener('click', clauseClickListener);
    suggestionsList.removeEventListener('click', matchClickListener);

    //tab listener
    input.addEventListener('keydown', wordKeyPressListener);

    suggestionsList.addEventListener('click', wordClickListener, { once: true });

    return;
  }

  if (clauseSuggestion > -1) {
    console.log('clause emit');
    socket.emit('suggestion', currentInput.slice(clauseSuggestion + 1), 'clauses');

    input.index = maxIndex;
    input.removeEventListener('keydown', wordKeyPressListener);
    input.removeEventListener('keydown', matchKeyPressListener);
    suggestionsList.removeEventListener('click', wordClickListener);
    suggestionsList.removeEventListener('click', matchClickListener);

    //tab listener
    input.addEventListener('keydown', clauseKeyPressListener);

    suggestionsList.addEventListener('click', clauseClickListener, { once: true });

    return;
  }

  if (matchclausesContent > -1) {
    console.log('match emit');

    socket.emit('matchedClauses', currentInput.slice(matchclausesContent + 1));

    input.index = maxIndex;
    input.removeEventListener('keydown', wordKeyPressListener);
    input.removeEventListener('keydown', clauseKeyPressListener);
    suggestionsList.removeEventListener('click', wordClickListener);
    suggestionsList.removeEventListener('click', clauseClickListener);

    //tab listener
    input.addEventListener('keydown', matchKeyPressListener);

    suggestionsList.addEventListener('click', matchClickListener, { once: true });

    return;
  }
}

function wordKeyPressListener(e) {
  const input = e.target;
  const currentInput = input.value;
  const suggestionsList = document.getElementById('suggestions');
  const wordSuggestion = input.index;

  if (suggestionsList.children.length === 0) return;

  if (e.key === 'Tab') {
    //to stay in the input field
    e.preventDefault();

    const selected = suggestionsList.querySelector('li.on');

    if (!selected) {
      const firstLi = suggestionsList.querySelector('li');
      firstLi.classList.add('on');
      return;
    }

    let nextLi = selected.nextElementSibling;
    if (!nextLi) {
      selected.classList.remove('on');

      const firstLi = suggestionsList.querySelector('li');
      firstLi.classList.add('on');

      return;
    }

    selected.classList.remove('on');
    nextLi.classList.add('on');
  }

  if (e.key === 'Enter') {
    e.preventDefault();
    const sugesstion = suggestionsList.querySelector('.on');

    input.value = currentInput.slice(0, wordSuggestion) + sugesstion.innerText;
    input.removeEventListener('keypress', wordKeyPressListener);
    input.removeEventListener('keypress', wordClickListener);
    suggestionsList.innerHTML = '';
    suggestionsList.classList.remove('on');

    //resize textarea
    input.style.height = 0;
    input.style.height = input.scrollHeight + 'px';
  }
}

function wordClickListener(e) {
  const input = document.getElementById('input');
  const currentInput = input.value;
  const suggestionsList = document.getElementById('suggestions');
  const wordSuggestion = input.index;

  input.value = currentInput.slice(0, wordSuggestion) + e.target.innerText;

  suggestionsList.innerHTML = '';

  suggestionsList.classList.remove('on');

  //resize textarea
  input.style.height = 0;
  input.style.height = input.scrollHeight + 'px';
}

function clauseKeyPressListener(e) {
  const input = document.getElementById('input');
  const currentInput = input.value;
  const suggestionsList = document.getElementById('suggestions');
  const clauseSuggestion = input.index;

  if (suggestionsList.children.length === 0) return;

  if (e.key === 'Tab') {
    //to stay in the input field
    e.preventDefault();

    const selected = suggestionsList.querySelector('tr.on');

    if (!selected) {
      const first = suggestionsList.querySelector('tr');
      first.classList.add('on');
      return;
    }

    let next = selected.nextElementSibling;
    if (!next) {
      selected.classList.remove('on');

      const first = suggestionsList.querySelector('tr');
      first.classList.add('on');

      return;
    }

    selected.classList.remove('on');
    next.classList.add('on');
  }

  if (e.key === 'Enter') {
    e.preventDefault();
    const sugesstion = suggestionsList.querySelector('.on');

    const number = sugesstion.dataset.number;

    //regulation which includes paragraph was selected
    if (isNaN(number[number.length - 1])) {
      const numberCharacters = number.split('');

      let article = '';
      let paragraph = '';

      for (let character of numberCharacters) {
        if (isNaN(character) && character !== '-') paragraph += character;
        else article += character;
      }

      input.value = `${currentInput.slice(0, clauseSuggestion)}${
        sugesstion.dataset.title
      }第${article}條第${paragraphMapping[paragraph]}項：「${sugesstion.dataset.body}」`;
    } else {
      input.value = `${currentInput.slice(0, clauseSuggestion)}${
        sugesstion.dataset.title
      }第${number}條：「${sugesstion.dataset.body}」`;
    }

    input.removeEventListener('keypress', wordKeyPressListener);
    input.removeEventListener('keypress', wordClickListener);
    suggestionsList.innerHTML = '';
    suggestionsList.classList.remove('on');

    //resize textarea
    input.style.height = 0;
    input.style.height = input.scrollHeight + 'px';
  }
}

function clauseClickListener(e) {
  const input = document.getElementById('input');
  const currentInput = input.value;
  const suggestionsList = document.getElementById('suggestions');
  const clauseSuggestion = input.index;

  let targetClause = e.target;
  while (!targetClause.hasAttribute('data-body')) {
    targetClause = targetClause.parentElement;
  }

  const number = targetClause.dataset.number;

  //regulation which includes paragraph was selected
  if (isNaN(number[number.length - 1])) {
    const numberCharacters = number.split('');

    let article = '';
    let paragraph = '';

    for (let character of numberCharacters) {
      if (isNaN(character) && character !== '-') paragraph += character;
      else article += character;
    }

    input.value = `${currentInput.slice(0, clauseSuggestion)}${
      targetClause.dataset.title
    }第${article}條第${paragraphMapping[paragraph]}項：「${targetClause.dataset.body}」`;
  } else {
    input.value = `${currentInput.slice(0, clauseSuggestion)}${targetClause.dataset.title}第${
      targetClause.dataset.number
    }條：「${targetClause.dataset.body}」`;
  }

  suggestionsList.innerHTML = '';

  suggestionsList.classList.remove('on');

  //resize textarea
  input.style.height = 0;
  input.style.height = input.scrollHeight + 'px';
}

function matchKeyPressListener(e) {
  const input = document.getElementById('input');
  const currentInput = input.value;
  const suggestionsList = document.getElementById('suggestions');
  const matchclausesContent = input.index;

  if (suggestionsList.children.length === 0) return;

  if (e.key === 'Tab') {
    //to stay in the input field
    e.preventDefault();

    const selected = suggestionsList.querySelector('tr.on');

    if (!selected) {
      const first = suggestionsList.querySelector('tr');
      first.classList.add('on');
      return;
    }

    let next = selected.nextElementSibling;
    if (!next) {
      selected.classList.remove('on');

      const first = suggestionsList.querySelector('tr');
      first.classList.add('on');

      return;
    }

    selected.classList.remove('on');
    next.classList.add('on');
  }

  if (e.key === 'Enter') {
    e.preventDefault();
    const suggestion = suggestionsList.querySelector('.on');

    input.value = `${currentInput.slice(0, matchclausesContent)}${suggestion.dataset.title}第${
      suggestion.dataset.number
    }條：「${suggestion.dataset.body}」`;

    input.removeEventListener('keypress', wordKeyPressListener);
    input.removeEventListener('keypress', wordClickListener);
    suggestionsList.innerHTML = '';
    suggestionsList.classList.remove('on');

    const title = suggestion.dataset.title;
    const number = suggestion.dataset.number;

    const now = new Date();
    const origin = now.toISOString();

    socket.emit('updateMatchedClauses', origin, title, number);
    suggestionsList.classList.remove('on');

    //resize textarea
    input.style.height = 0;
    input.style.height = input.scrollHeight + 'px';
  }
}

function matchClickListener(e) {
  const input = document.getElementById('input');
  const currentInput = input.value;
  const suggestionsList = document.getElementById('suggestions');
  const matchclausesContent = input.index;

  let targetClause = e.target;
  while (!targetClause.hasAttribute('data-body')) {
    targetClause = targetClause.parentElement;
  }

  input.value = `${currentInput.slice(0, matchclausesContent)}${targetClause.dataset.title}第${
    targetClause.dataset.number
  }條：「${targetClause.dataset.body}」`;

  suggestionsList.innerHTML = '';

  const title = targetClause.dataset.title;
  const number = targetClause.dataset.number;

  const now = new Date();
  const origin = now.toISOString();

  socket.emit('updateMatchedClauses', origin, title, number);
  suggestionsList.classList.remove('on');

  //resize textarea
  input.style.height = 0;
  input.style.height = input.scrollHeight + 'px';
}

function addUploadFileListener() {
  const chatUploadButton = document.querySelector('#chatUploadButton');

  chatUploadButton.addEventListener('change', e => {
    let totalSize = 0;

    //check previous total files size
    if (uploadfilesQueue.length !== 0) {
      for (let file of uploadfilesQueue) {
        totalSize += file.size;
      }
    }

    //check current files size
    for (let file of e.target.files) {
      if (file.size > 5 * 1024 * 1024) return setMsg('file size maximum: 5m ', 'error');

      totalSize += file.size;

      if (totalSize > 8 * 1024 * 1024) return setMsg('total size maximum: 8m ', 'error');
    }

    previewFile(e.target);
  });
}

function previewFile(filesInput) {
  const previewImageDiv = document.querySelector('#previewImageDiv');

  // console.log(filesInput.files);
  previewImageDiv.setAttribute('data-file', 'true');

  for (let i = 0; i < filesInput.files.length; i++) {
    const file = filesInput.files[i];
    const reader = new FileReader();

    if (file) {
      reader.readAsDataURL(file);
    }

    reader.addEventListener(
      'load',
      () => {
        if (uploadfilesQueue.length + 1 > 3) return setMsg('one time 3 files only', 'error');

        if (isImage(file.name)) {
          const previewImage = document.createElement('img');
          previewImage.setAttribute('class', 'chat-upload-image-preview');
          previewImage.src = reader.result;

          previewImageDiv.appendChild(previewImage);
          uploadfilesQueue.push(file);
        } else {
          const fileDiv = document.createElement('div');
          fileDiv.setAttribute('class', 'chat-upload-file-preview');

          if (file.name.length > 20) {
            const extensionIndex = file.name.lastIndexOf('.');
            fileDiv.innerText =
              file.name.slice(0, 20) + '...' + file.name.slice(extensionIndex - 3);
          } else fileDiv.innerText = file.name;

          previewImageDiv.appendChild(fileDiv);
          uploadfilesQueue.push(file);
        }
      },
      false
    );
  }
}

async function uploadFile(authorization) {
  const formData = new FormData();

  const uploadfilesQueueLength = uploadfilesQueue.length;

  for (let i = 0; i < uploadfilesQueueLength; i++) {
    formData.append('images', uploadfilesQueue.shift());
  }

  // console.log('Going to upload this: ', filesInput);

  const api = `${HOST}/1.0/message/upload`;

  const res = await fetch(api, {
    method: 'POST',
    headers: {
      'Authorization': authorization,
    },
    body: formData,
  });

  clearUploadFiles();

  const response = await res.json();

  return response;
}

function addUnloadFileListener() {
  const unloadFileButton = document.querySelector('#chatUnloadFileButton');
  // const uploadButton = document.querySelector('#chatUploadButton');

  //Remove all selected files
  unloadFileButton.addEventListener('click', e => {
    e.preventDefault();

    clearUploadFiles();
  });
}

function clearUploadFiles() {
  const uploadButton = document.querySelector('#chatUploadButton');
  const previewImageDiv = document.querySelector('#previewImageDiv');
  const previewImage = document.querySelectorAll('.chat-upload-image-preview');
  const previewFile = document.querySelectorAll('.chat-upload-file-preview');

  for (let image of previewImage) image.remove();
  for (let file of previewFile) file.remove();

  uploadButton.value = '';
  uploadfilesQueue = [];
  previewImageDiv.setAttribute('data-file', 'false');
}

export { addChatListenerToContactDivs, addGroupChatListenerToGroupDivs };
