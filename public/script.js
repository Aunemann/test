document.addEventListener('DOMContentLoaded', () => {
  const candidates = document.querySelectorAll('.candidate');
  const voteButtons = document.querySelectorAll('.vote-button');
  const voterIdInput = document.getElementById('voterId');
  const resultsContainer = document.getElementById('results');

  // Generate or retrieve a unique voter ID
  let voterId = localStorage.getItem('voterId');
  if (!voterId) {
    voterId = generateVoterId();
    localStorage.setItem('voterId', voterId);
  }
  if (voterIdInput) {
    voterIdInput.value = voterId;
  }

  // Intersection Observer for reveal animations
  const observerOptions = {
    root: null,
    threshold: 0.1,
  };

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, observerOptions);

  candidates.forEach(candidate => {
    observer.observe(candidate);
  });

  // Check if the user has already voted and disable buttons accordingly
  checkIfVoted();

  // Smooth scrolling for "Scroll Down" link
  const scrollDownLink = document.querySelector('.scroll-down');
  if (scrollDownLink) {
    scrollDownLink.addEventListener('click', e => {
      e.preventDefault();
      document.querySelector('#candidates').scrollIntoView({
        behavior: 'smooth'
      });
    });
  }

  // Add event listeners to vote buttons
  voteButtons.forEach(button => {
    button.addEventListener('click', () => {
      const candidateName = button.getAttribute('data-candidate');

      // Send vote to the server
      fetch('/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ candidate: candidateName, voterId })
      })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          alert(data.error);
        } else {
          alert(data.message);
          // Disable all vote buttons
          disableVoteButtons();
          // Update results
          updateResults();
        }
      })
      .catch(error => {
        console.error('Error:', error);
      });
    });
  });

  // Function to disable vote buttons after voting
  function disableVoteButtons() {
    voteButtons.forEach(btn => {
      btn.disabled = true;
      btn.textContent = 'You have already voted';
    });
  }

  // Function to check if the user has already voted
  function checkIfVoted() {
    fetch(`/hasVoted?voterId=${voterId}`)
      .then(response => response.json())
      .then(data => {
        if (data.hasVoted) {
          disableVoteButtons();
        }
      })
      .catch(error => {
        console.error('Error:', error);
      });
  }

  // Function to update results on the page
  function updateResults() {
    fetch('/results')
      .then(response => response.json())
      .then(votes => {
        // Display the vote counts
        displayResults(votes);
      })
      .catch(error => {
        console.error('Error fetching results:', error);
      });
  }

  // Function to display results
  function displayResults(votes) {
    if (resultsContainer) {
      resultsContainer.innerHTML = ''; // Clear previous results

      for (const [candidate, count] of Object.entries(votes)) {
        const resultItem = document.createElement('p');
        resultItem.textContent = `${candidate}: ${count} vote${count !== 1 ? 's' : ''}`;
        resultsContainer.appendChild(resultItem);
      }
    }
  }

  // Function to generate a unique voter ID
  function generateVoterId() {
    return 'voter-' + Math.random().toString(36).substr(2, 9);
  }

  // Initial call to fetch and display results
  updateResults();
});
