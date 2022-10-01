const duration = 3000;
const delay = 500;

mainTour();

function mainTour() {
  let steps = [
    {
      element: '#all',
      title: 'All Colleagues',
      content: 'Click to show all colleagues',
      onNext: tour => {
        $('#all .header').click();
        tour.restart();
      },
    },
    {
      element: '.contact-add-star-button:first',
      title: 'Mark frequent contacts',
      content: 'Add the colleague to "Starred" block',
    },
    {
      element: '#star',
      title: 'Starred Colleagues',
      content: 'Click to show starred colleagues',
      onNext: tour => {
        $('#star .header').click();
        tour.restart();
      },
    },
    {
      element: '.contact-delete-star-button:first',
      title: 'Remove frequent contacts',
      content: 'Remove the colleague from "Starred" block',
    },
    {
      element: '#group',
      title: 'Group Channels',
      content: 'Click to show groups you have joined',
      onNext: tour => {
        $('#group .header').click();
        tour.restart();
      },
    },
    {
      element: '.group-delete-button:first',
      title: 'Leave Group Channel',
      content: 'If you are the host of the group, the group will be dissolved',
    },
  ];

  const role = localStorage.getItem('role');

  if (role === '-1') {
    steps.push({
      element: '#adminButton',
      title: 'Admin Panel',
      content: 'Edit Firm Logo, create or delete user account',
      placement: 'top',
    });
  }

  steps = [
    ...steps,
    {
      element: '#profile',
      title: 'Edit Profile',
      content: 'Edit password or profile picture',
      placement: 'top',
    },
    {
      element: '#groupAddParticipants',
      title: 'Manage Groups',
      content: 'Create group, add or delete member',
      duration: false,
      placement: 'top',
    },
  ];

  // eslint-disable-next-line no-undef
  const tour = new Tour({
    name: 'main',
    steps,
    duration,
    delay,
    onStart: endTourListener,
  });

  tour.init();
  tour.start();
}

function groupTour() {
  const steps = [
    {
      element: 'input.group-function:first',
      title: 'Create a Group',
      content: 'Enter the name of the new group and click "create"',
      duration: 5000,
      onShown: () => $('#group .header').click(),
      onNext: tour => {
        const groupName = 'Google v. Oracle';
        typeWriter('input.group-function:first', groupName, 0);

        const currentStepIndex = tour.getCurrentStep();

        tour.end();
        setTimeout(() => {
          $('form.group-function:first button.group-function').click();
          tour.restart();
          tour.goTo(currentStepIndex + 1);
        }, 1300);
      },
    },
    {
      element: '[data-name="Google v. Oracle"]',
      title: 'Chat in Group',
      content: 'Click to enter the group conversation',
      onNext: () => $('[data-name="Google v. Oracle"]').click(),
    },
  ];

  // eslint-disable-next-line no-undef
  const tour = new Tour({
    name: 'group',
    steps,
    delay,
    onStart: endTourListener,
  });

  tour.init();
  tour.start();
}

function searchTour() {
  const steps = [
    {
      title: 'Search For Regulations',
      content:
        'To search regulations by the name and the article,<br>enter " @ " symbol followed by the name and the article',
      orphan: true,
    },
    {
      element: '#input',
      backdrop: true,
      duration: 2000,
      onShown: () => {
        const popover = document.querySelector('#step-1');
        popover.style.display = 'none';
        console.log(popover);

        typeWriter('#input', '@著作權法60', 0);
        const input = document.getElementById('input');
        input.dispatchEvent(new KeyboardEvent('keydown'));
      },
    },
    {
      element: '#suggestions',
      title: 'Search For Regulations',
      content: 'Press "Tab" to move between results',
      placement: 'top',
      onShown: () => {
        const input = document.getElementById('input');
        input.focus();
        input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));

        input.addEventListener('keydown', function nextStep(e) {
          if (e.key === 'Tab') {
            tour.next();
            input.removeEventListener('keydown', nextStep);
          }
        });
      },
    },
    {
      element: '#suggestions',
      title: 'Search For Regulations',
      content: 'Press " Enter " to select',
      placement: 'top',
      onShown: tour => {
        const input = document.getElementById('input');
        input.addEventListener('keydown', function nextStep(e) {
          if (e.key === 'Enter') {
            tour.next();
            input.removeEventListener('keydown', nextStep);
          }
        });
      },
    },
    {
      element: '#input',
      title: 'Search For Regulations',
      content: 'The selected clause will be added',
      duration: 5000,
      backdrop: true,
      placement: 'top',
    },
    {
      title: 'Search Mode',
      content: `<tr><td>＠著作權法60</td><td>search regulations by name and article</td></tr>
                <tr><td>｜電腦程式著作</td><td>search regulations by keyword</td></tr>
                <tr><td>＃著作</td><td>suggestions for legal term</td></tr>`,
      duration: false,
      orphan: true,
      onShown: () => {
        const popover = document.querySelector('#step-5');
        const tds = popover.querySelectorAll('td');

        for (let td of tds) {
          td.style.padding = '0.5rem 1rem';
        }
      },
    },
  ];

  // eslint-disable-next-line no-undef
  const tour = new Tour({
    name: 'search',
    steps,
    delay,
    onStart: endTourListener,
  });

  tour.init();
  tour.start();
}

function typeWriter(selector, text, i) {
  const speed = 50; /* The speed/duration of the effect in milliseconds */

  if (i < text.length) {
    $(selector).val($(selector).val() + text[i]);
    i++;
    setTimeout(typeWriter, speed, selector, text, i);
  }
}

function endTourListener(tour) {
  //1s after starting a tour, check whether there are popovers
  setTimeout(() => {
    if ($('.popover').length) {
      //if there are popovers, add end tour listener to html element
      $('html').click(function endTour(e) {
        //if the element which is clicked by the user is not within popover, end the tour
        if (!$(e.target).parents('.popover').length) {
          tour.end();
          $('.popover').remove();
          $('html').off('click', endTour);
        }

        //if user click on the end tour button, remove end tour listener
        if ($(e.target).data('role') === 'end') {
          $('html').off('click', endTour);
        }
      });
    }
  }, 1000);
}

export { searchTour, groupTour };
