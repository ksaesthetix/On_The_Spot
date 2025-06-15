document.addEventListener('DOMContentLoaded', function() {
    console.log("vendor.js loaded");
    
    // Get vendor from URL
    const params = new URLSearchParams(window.location.search);
    let vendorName = params.get('vendor');

    // If vendorName exists, save it for future visits
    if (vendorName) {
        localStorage.setItem('ots_last_vendor', vendorName);
    } else {
        // Try to get last visited vendor from localStorage
        vendorName = localStorage.getItem('ots_last_vendor');
        if (vendorName) {
            // Redirect to the vendor page with the parameter
            window.location.href = `vendor.html?vendor=${encodeURIComponent(vendorName)}`;
            return;
        } else {
            // No vendor info available, show a message or a list
            document.body.innerHTML = `
                <main style="padding:2em;text-align:center;">
                    <h2>No vendor selected</h2>
                    <p>Please select a vendor from the <a href="index.html">home page</a>.</p>
                </main>
            `;
            return;
        }
    }

    // Always set nav "My Profile" link to the logged-in user's profile
    const user = JSON.parse(localStorage.getItem('ots_user') || 'null');
    const profileLink = document.querySelector('.dropdown-content a.active');
    if (profileLink && user && user.email) {
        profileLink.href = `profile.html?user=${encodeURIComponent(user.email)}`;
        profileLink.textContent = user.name ? `@${user.name}` : "My Profile";
    } else if (profileLink) {
        profileLink.href = "login.html";
        profileLink.textContent = "Sign In";
    }

    // Update the dropdown link to point to the vendor profile
    const vendorProfileLink = document.querySelector('.dropdown-content a.active');
    console.log(vendorProfileLink);
    if (vendorProfileLink && vendorName) {
        vendorProfileLink.href = `vendor.html?vendor=${encodeURIComponent(vendorName)}`;
        vendorProfileLink.textContent = "Vendor Profile";
    }

    const vendorNameElem = document.getElementById('vendor-name');
    if (vendorNameElem && vendorName) {
        vendorNameElem.textContent = vendorName;
    }

    // Example event data (replace with fetch if needed)
    const allEvents = [
        {
            vendor: "MediaLink Beach",
            dateTime: "2025-06-18 10:00",
            name: "Morning Networking",
            description: "Kick off the day with coffee and connections.",
            type: "Networking",
            url: "https://example.com/event1",
            rsvp: "Required",
            location: "Beach Tent A"
        },
        {
            vendor: "MediaLink Beach",
            dateTime: "2025-06-18 14:00",
            name: "Panel: Future of Media",
            description: "Industry leaders discuss trends.",
            type: "Panel",
            url: "https://example.com/event2",
            rsvp: "Optional",
            location: "Main Stage"
        }
        // ...more events...
    ];

    // Filter events for this vendor
    const vendorEvents = allEvents.filter(ev => ev.vendor === vendorName);

    // Render events
    const tbody = document.getElementById('vendor-events-list');
    tbody.innerHTML = vendorEvents.map((ev, idx) => `
        <tr>
            <td>${ev.dateTime}</td>
            <td>${ev.name}</td>
            <td>${ev.description}</td>
            <td>${ev.type}</td>
            <td>${ev.location}</td>
            <td><a href="${ev.url}" target="_blank">Link</a></td>
            <td>${ev.rsvp}</td>
            <td><button class="add-itinerary-btn" data-idx="${idx}">Add</button></td>
        </tr>
    `).join('');

    // Add to itinerary handler
    tbody.addEventListener('click', function(e) {
        if (e.target.classList.contains('add-itinerary-btn')) {
            const idx = e.target.getAttribute('data-idx');
            const event = vendorEvents[idx];
            // Save to localStorage itinerary
            let itinerary = JSON.parse(localStorage.getItem('ots_itinerary') || '[]');
            itinerary.push(event);
            localStorage.setItem('ots_itinerary', JSON.stringify(itinerary));
            document.getElementById('event-added-msg').textContent = "Event added to your itinerary!";
            document.getElementById('event-added-msg').style.display = 'block';
            setTimeout(() => {
                document.getElementById('event-added-msg').style.display = 'none';
            }, 2000);
        }
    });
});