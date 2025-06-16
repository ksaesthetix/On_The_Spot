let allVendors = [];
let map, vendorMarkers = [], infoWindows = [];
let directionsService, directionsRenderer;

window.initGoogleMap = function() {
    map = new google.maps.Map(document.getElementById('google-map'), {
        center: { lat: 43.5539, lng: 7.0170 },
        zoom: 14,
        mapTypeId: 'roadmap'
    });
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        panel: document.getElementById('directions-panel')
    });

    fetch('cannesfringeeventdata_with_coords.json')
        .then(res => res.json())
        .then(data => {
            allVendors = data
                .filter(e =>
                    e['host '] && e.latitude && e.longitude &&
                    !isNaN(Number(e.latitude)) && !isNaN(Number(e.longitude))
                )
                .map(e => ({
                    name: (e['host '] || '').trim(),
                    lat: Number(e.latitude),
                    lng: Number(e.longitude),
                    type: e.event_type || 'Event',
                    date_time: e.date_time || ''
                }));

            // Populate filter dropdowns
            const eventTypes = [...new Set(allVendors.map(e => e.type).filter(Boolean))];
            const dateTimes = [...new Set(allVendors.map(e => e.date_time).filter(Boolean))];
            document.getElementById('event-type-filter').innerHTML =
                '<option value="">All Types</option>' +
                eventTypes.map(type => `<option value="${type}">${type}</option>`).join('');
            document.getElementById('date-time-filter').innerHTML =
                '<option value="">All Dates</option>' +
                dateTimes.map(dt => `<option value="${dt}">${dt}</option>`).join('');

            renderVendors();
            syncVendorDropdown();
        });

    document.getElementById('event-type-filter').addEventListener('change', renderVendors);
    document.getElementById('date-time-filter').addEventListener('change', renderVendors);
    document.getElementById('clear-filters-btn').addEventListener('click', function() {
        document.getElementById('event-type-filter').selectedIndex = 0;
        document.getElementById('date-time-filter').selectedIndex = 0;
        renderVendors();
    });
    document.getElementById('vendor-dropdown').addEventListener('change', function(e) {
        const idx = parseInt(e.target.value, 10);
        if (!isNaN(idx)) {
            map.setCenter({ lat: allVendors[idx].lat, lng: allVendors[idx].lng });
            map.setZoom(17);
            infoWindows[idx].open(map, vendorMarkers[idx]);
            setActiveListItem(idx);
        }
    });
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
        const marker = new google.maps.Marker({
            position: { lat: v.lat, lng: v.lng },
            map,
            title: v.name
        });

        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div>
                    <b>${v.name}</b><br>${v.type}<br>${v.date_time}<br>
                    <button class="directions-btn" data-lat="${v.lat}" data-lng="${v.lng}">Get Directions</button>
                </div>
            `
        });

        marker.addListener('click', () => {
            infoWindows.forEach(iw => iw.close());
            infoWindow.open(map, marker);
            setActiveListItem(idx);

            // Attach event listener to the button inside the InfoWindow after it opens
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
        li.textContent = v.name;
        li.addEventListener('click', () => {
            map.setCenter({ lat: v.lat, lng: v.lng });
            map.setZoom(17);
            infoWindows.forEach(iw => iw.close());
            infoWindow.open(map, marker);
            setActiveListItem(idx);

            // Attach event listener to the button inside the InfoWindow after it opens
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
}

// Expose planRoute globally
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
    vendorDropdown.innerHTML = '<option value="">Select a vendor...</option>';
    allVendors.forEach((v, idx) => {
        const option = document.createElement('option');
        option.value = idx;
        option.textContent = v.name;
        vendorDropdown.appendChild(option);
    });
}