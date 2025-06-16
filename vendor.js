document.addEventListener('DOMContentLoaded', function() {
    console.log("vendor.js loaded");
    
    // Get vendor from URL
    const params = new URLSearchParams(window.location.search);
    let vendorName = params.get('vendor');

    // If vendorName exists, save it for future visits
    if (vendorName) {
        localStorage.setItem('ots_last_vendor', vendorName);
    } else {
        vendorName = localStorage.getItem('ots_last_vendor');
        if (vendorName) {
            window.location.href = `vendor.html?vendor=${encodeURIComponent(vendorName)}`;
            return;
        } else {
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

    const vendorNameElem = document.getElementById('vendor-name');
    if (vendorNameElem && vendorName) {
        vendorNameElem.textContent = vendorName;
    }

    // Fetch and display vendor events from JSON
    fetch('cannesfringeeventdata_with_coords.json')
        .then(response => response.json())
        .then(allEvents => {
            // Robust filter: trim and lowercase both sides
            const vendorEvents = allEvents.filter(ev => {
                const host = (ev["host "] || "").trim().toLowerCase();
                const vendor = (vendorName || "").trim().toLowerCase();
                return host === vendor;
            });

            // Debug: log available hosts and vendorName
            // console.log("Looking for vendor:", vendorName);
            // console.log("Available hosts:", [...new Set(allEvents.map(ev => (ev["host "] || "").trim()))]);

            const tbody = document.getElementById('vendor-events-list');
            if (tbody) {
                tbody.innerHTML = vendorEvents.map((ev, idx) => {
                    // Safe date formatting
                    const dateStr = ev.date_time || "";
                    let formattedDate = "";
                    if (dateStr) {
                        const d = new Date(dateStr);
                        formattedDate = !isNaN(d) ? d.toISOString().split("T")[0] : dateStr;
                    }
                    return `
                    <tr>
                        <td>${formattedDate}</td>
                        <td>${ev.event_name || ''}</td>
                        <td>${ev.description || ''}</td>
                        <td>${ev.event_type || ''}</td>
                        <td>${ev.location || ''}</td>
                        <td>${ev.url_link ? `<a href="${ev.url_link}" target="_blank">Link</a>` : ''}</td>
                        <td>${ev.rsvp || ''}</td>
                        <td>
                            <button 
                                class="add-itinerary-btn"
                                data-name="${ev.event_name || ''}"
                                data-time="${ev.date_time && !isNaN(new Date(ev.date_time)) ? new Date(ev.date_time).toISOString() : ''}"
                                data-vendor="${vendorName || ''}"
                                data-description="${ev.description || ''}"
                                data-event_type="${ev.event_type || ''}"
                                data-location="${ev.location || ''}"
                                data-url_link="${ev.url_link || ''}"
                            >Add</button>
                        </td>
                    </tr>
                    `;
                }).join('');
            }
        })
        .catch(err => {
            console.error('Failed to load vendor events:', err);
        });

    const API_BASE = 'https://on-the-spot.onrender.com';
    const token = localStorage.getItem('ots_jwt');

    // Handle Add to Itinerary button (POST to backend)
    document.body.addEventListener('click', function(e) {
        if (e.target.classList.contains('add-itinerary-btn')) {
            e.preventDefault();
            const btn = e.target;
            const eventData = {
                name: btn.getAttribute('data-name'),
                time: btn.getAttribute('data-time'),
                vendor: btn.getAttribute('data-vendor'),
                description: btn.getAttribute('data-description'),
                event_type: btn.getAttribute('data-event_type'),
                location: btn.getAttribute('data-location'),
                url_link: btn.getAttribute('data-url_link')
            };
            fetch(`${API_BASE}/api/itinerary`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(eventData)
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    let msg = document.getElementById('event-added-msg');
                    if (!msg) {
                        msg = document.createElement('div');
                        msg.id = 'event-added-msg';
                        msg.style.cssText = 'color:green;margin:1em;';
                        document.body.appendChild(msg);
                    }
                    msg.textContent = "Event added to your itinerary!";
                    msg.style.display = 'block';
                    setTimeout(() => { msg.style.display = 'none'; }, 2000);
                } else {
                    alert('Could not add to itinerary.');
                }
            })
            .catch(err => {
                alert('An error occurred while adding to itinerary.');
                console.error(err);
            });
        }
    });
});