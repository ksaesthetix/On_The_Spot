// Redirect to login if not authenticated
if (!localStorage.getItem('ots_jwt')) {
    window.location.href = 'login.html';
}

let allVendors = [];
let hostEventsMap = {};
let map, vendorMarkers = [], infoWindows = [];
let directionsService, directionsRenderer;
window.userEventMarkers = [];

// Google Maps initialization (must be global)
window.initGoogleMap = function() {
    map = new google.maps.Map(document.getElementById('google-map'), {
        center: { lat: 43.5539, lng: 7.0200 },
        zoom: 15,
        mapTypeId: 'roadmap'
    });
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        panel: document.getElementById('directions-panel')
    });

    // Show user location marker
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const userLatLng = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            new google.maps.Marker({
                position: userLatLng,
                map: map,
                title: "Your Location",
                icon: {
                    url: "https://maps.google.com/mapfiles/kml/shapes/man.png",
                    scaledSize: new google.maps.Size(40, 40)
                }
            });
        });
    }

    // Load vendor data
    fetch('cannesfringeeventdata_with_coords.json')
        .then(res => res.json())
        .then(data => {
            allVendors = data
                .filter(e =>
                    e['host '] && e.latitude && e.longitude &&
                    !isNaN(Number(e.latitude)) && !isNaN(Number(e.longitude))
                )
                .map(e => ({
                    host: (e['host '] || '').trim(),
                    event_name: (e.event_name || '').trim(),
                    lat: Number(e.latitude),
                    lng: Number(e.longitude),
                    type: e.event_type || 'Event',
                    date_time: e.date_time || '',
                    description: e.description || '',
                    url_link: e.url_link || '',
                    location: e.location || '',
                    logo: e.logo || ''
                }));

            // Group by host
            hostEventsMap = {};
            allVendors.forEach(ev => {
                if (!hostEventsMap[ev.host]) hostEventsMap[ev.host] = [];
                hostEventsMap[ev.host].push(ev);
            });

            // Populate filters
            const eventTypes = [...new Set(allVendors.map(e => e.type).filter(Boolean))].sort();
            const dateTimes = [...new Set(allVendors.map(e => e.date_time).filter(Boolean))].sort();
            document.getElementById('event-type-filter').innerHTML =
                '<option value="">All Types</option>' +
                eventTypes.map(type => `<option value="${type}">${type}</option>`).join('');
            document.getElementById('date-time-filter').innerHTML =
                '<option value="">All Dates</option>' +
                dateTimes.map(dt => `<option value="${dt}">${dt}</option>`).join('');

            renderVendors();
            syncVendorDropdown();
        });

    // Filter events
    document.getElementById('event-type-filter').addEventListener('change', renderVendors);
    document.getElementById('date-time-filter').addEventListener('change', renderVendors);
    document.getElementById('clear-filters-btn').addEventListener('click', function() {
        document.getElementById('event-type-filter').selectedIndex = 0;
        document.getElementById('date-time-filter').selectedIndex = 0;
        renderVendors();
    });

    // Vendor dropdown
    const vendorDropdown = document.getElementById('vendor-dropdown');
    if (vendorDropdown) {
        vendorDropdown.addEventListener('change', function(e) {
            const hostName = e.target.value;
            if (hostName && hostEventsMap[hostName]) {
                const firstEvent = hostEventsMap[hostName][0];
                map.setCenter({ lat: firstEvent.lat, lng: firstEvent.lng });
                map.setZoom(17);

                // Build popup with all events for this host
                const events = hostEventsMap[hostName];
                let popupContent = `<div style="max-width:350px;text-align:center;">`;
                if (events[0].logo) {
                    popupContent += `<img src="${events[0].logo}" alt="${hostName}" style="width:150px;height:150px;border-radius:12px;margin-bottom:1px;object-fit:contain;"><br>`;
                }
                popupContent += `<h3>${hostName}</h3><ul style="padding-left:1em;text-align:left;">`;
                events.forEach(ev => {
                    popupContent += `<li style="margin-bottom:1em;">
                        <b>${ev.event_name}</b><br>
                        ${ev.type || ''} ${ev.date_time ? `<br>${ev.date_time}` : ''}
                        ${ev.location ? `<br><i>${ev.location}</i>` : ''}
                        ${ev.description ? `<br><small>${ev.description}</small>` : ''}
                        ${ev.url_link ? `<br><a href="${ev.url_link}" target="_blank">Event Link</a>` : ''}
                        <br><button class="directions-btn" data-lat="${ev.lat}" data-lng="${ev.lng}">Get Directions</button>
                    </li>`;
                });
                popupContent += `</ul></div>`;

                infoWindows.forEach(iw => iw.close());
                const popup = new google.maps.InfoWindow({ content: popupContent });
                popup.open(map, vendorMarkers[allVendors.findIndex(v => v === firstEvent)]);

                google.maps.event.addListenerOnce(popup, 'domready', function() {
                    document.querySelectorAll('.directions-btn').forEach(btn => {
                        btn.addEventListener('click', function() {
                            const lat = parseFloat(this.getAttribute('data-lat'));
                            const lng = parseFloat(this.getAttribute('data-lng'));
                            planRoute(lat, lng);
                        });
                    });
                });
            }
        });
    }

    // --- Render user events on the map (user-added events) ---
    fetchAndRenderUserEvents();
};

function getFilteredVendors() {
    const selectedType = document.getElementById('event-type-filter').value;
    const selectedDate = document.getElementById('date-time-filter').value;
    return allVendors.filter(v =>
        (selectedType === "" || v.type === selectedType) &&
        (selectedDate === "" || v.date_time === selectedDate)
    );
}

function renderVendors() {
    vendorMarkers.forEach(marker => marker.setMap(null));
    vendorMarkers = [];
    infoWindows = [];

    const vendors = getFilteredVendors();
    const vendorListPanel = document.getElementById('vendor-list-panel');
    vendorListPanel.innerHTML = `<ul id="vendor-list"></ul>`;
    const vendorList = document.getElementById('vendor-list');

    vendors.forEach((v, idx) => {
        const markerIcon = v.logo
            ? { url: v.logo, scaledSize: new google.maps.Size(64, 64) }
            : {
                url: "data:image/svg+xml;utf-8," + encodeURIComponent(`
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="20" cy="20" r="16" fill="#FF5E5B" stroke="#2E2E2E" stroke-width="3"/>
                    <circle cx="20" cy="20" r="7" fill="#FAF9F8"/>
                    </svg>
                `),
                scaledSize: new google.maps.Size(40, 40)
            };

        const marker = new google.maps.Marker({
            position: { lat: v.lat, lng: v.lng },
            map,
            title: v.host,
            icon: markerIcon
        });

        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div style="text-align:center;">
                    ${v.logo ? `<img src="${v.logo}" alt="${v.host}" style="width:96px;height:96px;border-radius:12px;margin-bottom:12px;object-fit:contain;"><br>` : ""}
                    <b>${v.host}</b><br>${v.event_name}<br>${v.type}<br>${v.date_time}<br>
                    <button class="directions-btn" data-lat="${v.lat}" data-lng="${v.lng}">Get Directions</button>
                </div>
            `
        });

        marker.addListener('click', () => {
            infoWindows.forEach(iw => iw.close());
            infoWindow.open(map, marker);
            setActiveListItem(idx);

            google.maps.event.addListenerOnce(infoWindow, 'domready', function() {
                const btn = document.querySelector('.directions-btn');
                if (btn) {
                    btn.addEventListener('click', function(e) {
                        const lat = parseFloat(this.getAttribute('data-lat'));
                        const lng = parseFloat(this.getAttribute('data-lng'));
                        planRoute(lat, lng);
                    });
                }
            });
        });

        vendorMarkers.push(marker);
        infoWindows.push(infoWindow);

        const li = document.createElement('li');
        li.textContent = v.host;
        li.addEventListener('click', () => {
            map.setCenter({ lat: v.lat, lng: v.lng });
            map.setZoom(17);
            infoWindows.forEach(iw => iw.close());
            infoWindow.open(map, marker);
            setActiveListItem(idx);

            google.maps.event.addListenerOnce(infoWindow, 'domready', function() {
                const btn = document.querySelector('.directions-btn');
                if (btn) {
                    btn.addEventListener('click', function(e) {
                        const lat = parseFloat(this.getAttribute('data-lat'));
                        const lng = parseFloat(this.getAttribute('data-lng'));
                        planRoute(lat, lng);
                    });
                }
            });
        });
        vendorList.appendChild(li);
    });

    function setActiveListItem(activeIdx) {
        Array.from(vendorList.children).forEach((li, idx) => {
            li.classList.toggle('active', idx === activeIdx);
        });
    }
    window.setActiveListItemByHost = function(hostName) {
        Array.from(vendorList.children).forEach((li) => {
            li.classList.toggle('active', li.textContent === hostName);
        });
    };
}

function planRoute(destLat, destLng) {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const origin = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            const destination = { lat: destLat, lng: destLng };
            directionsService.route(
                {
                    origin,
                    destination,
                    travelMode: google.maps.TravelMode.WALKING
                },
                (response, status) => {
                    if (status === 'OK') {
                        directionsRenderer.setDirections(response);
                        map.fitBounds(response.routes[0].bounds);
                    } else {
                        alert('Directions request failed: ' + status);
                    }
                }
            );
        }, function() {
            alert("Could not get your location.");
        });
    } else {
        alert("Geolocation is not supported by your browser.");
    }
}
window.planRoute = planRoute;

function syncVendorDropdown() {
    const vendorDropdown = document.getElementById('vendor-dropdown');
    if (!vendorDropdown) return;
    vendorDropdown.innerHTML = '<option value="">Select a vendor...</option>';
    const hostNames = Object.keys(hostEventsMap).sort();
    hostNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        vendorDropdown.appendChild(option);
    });
}

// --- User Event Submission and Rendering ---
document.addEventListener('DOMContentLoaded', function() {
    const API_BASE = 'https://on-the-spot.onrender.com';
    const token = localStorage.getItem('ots_jwt');
    const form = document.getElementById('add-event-form');
    const msgDiv = document.getElementById('add-event-msg');
    const locationInput = document.getElementById('event-location');
    const latInput = document.getElementById('event-lat');
    const lngInput = document.getElementById('event-lng');
    const submitBtn = document.getElementById('add-event-submit-btn');
    const openBtn = document.getElementById('open-add-event-modal');
    const modal = document.getElementById('add-event-modal');
    const closeBtn = document.getElementById('close-add-event-modal');

    function setLocationFields(lat, lng) {
        latInput.value = lat;
        lngInput.value = lng;
        locationInput.value = `Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`;
        submitBtn.disabled = false;
        msgDiv.textContent = "";
    }

    if (openBtn && modal && closeBtn) {
        openBtn.onclick = () => {
            modal.style.display = 'block';
            locationInput.value = "Detecting your location...";
            submitBtn.disabled = true;
            latInput.value = "";
            lngInput.value = "";
            msgDiv.textContent = "";

            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function(pos) {
                    setLocationFields(pos.coords.latitude, pos.coords.longitude);
                }, function() {
                    locationInput.value = "Could not get your location.";
                    msgDiv.textContent = "Location permission is required to add an event.";
                    submitBtn.disabled = true;
                });
            } else {
                locationInput.value = "Geolocation not supported.";
                msgDiv.textContent = "Geolocation is not supported by your browser.";
                submitBtn.disabled = true;
            }
        };
        closeBtn.onclick = () => { modal.style.display = 'none'; };
        window.onclick = function(event) {
            if (event.target === modal) modal.style.display = 'none';
        };
    }

    if (form) {
        form.onsubmit = function(e) {
            e.preventDefault();
            if (!token) {
                msgDiv.textContent = "You must be logged in.";
                msgDiv.style.color = "red";
                return;
            }
            const name = document.getElementById('event-name').value.trim();
            const host = document.getElementById('event-host').value.trim();
            const date_time = document.getElementById('event-date-time').value;
            const location = document.getElementById('event-location').value.trim();
            const lat = parseFloat(latInput.value);
            const lng = parseFloat(lngInput.value);

            if (!name || !host || !date_time || !location || isNaN(lat) || isNaN(lng)) {
                msgDiv.textContent = "All fields and location are required.";
                msgDiv.style.color = "red";
                return;
            }

            fetch(`${API_BASE}/api/user-events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ name, host, date_time, location, lat, lng })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    msgDiv.textContent = "Event added!";
                    msgDiv.style.color = "green";
                    form.reset();
                    latInput.value = "";
                    lngInput.value = "";
                    fetchAndRenderUserEvents();
                } else {
                    msgDiv.textContent = data.message || "Failed to add event.";
                    msgDiv.style.color = "red";
                }
            });
        };
    }
});

// --- Render user events on the map ---
window.fetchAndRenderUserEvents = function() {
    const API_BASE = 'https://on-the-spot.onrender.com';
    fetch(`${API_BASE}/api/user-events`)
        .then(res => res.json())
        .then(events => {
            if (!window.map) return;
            if (!window.userEventMarkers) window.userEventMarkers = [];
            window.userEventMarkers.forEach(m => m.setMap(null));
            window.userEventMarkers = [];

            events.forEach(ev => {
                if (ev.lat && ev.lng) {
                    const marker = new google.maps.Marker({
                        position: { lat: ev.lat, lng: ev.lng },
                        map: window.map,
                        title: ev.name,
                        icon: {
                            url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
                        }
                    });
                    marker.addListener('click', function() {
                        new google.maps.InfoWindow({
                            content: `<b>${ev.name}</b><br>Host: ${ev.host}<br>${ev.date_time}<br>${ev.location}`
                        }).open(window.map, marker);
                    });
                    window.userEventMarkers.push(marker);
                }
            });
        });
};