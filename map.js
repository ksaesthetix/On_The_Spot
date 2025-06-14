document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('ots_jwt');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    fetch('https://on-the-spot.onrender.com/api/profile', {
        headers: { 'Authorization': 'Bearer ' + token }
    })
    .then(res => res.json())
    .then(user => {
        if (!user.hasPaid) {
            window.location.href = 'paywall.html';
        } else {
            // ...rest of your page logic here...
        }
    })
    .catch(() => {
        window.location.href = 'login.html';
    });
});

document.addEventListener('DOMContentLoaded', function() {
    if (typeof L !== 'undefined' && document.getElementById('map')) {
        var map = L.map('map').setView([43.5539, 7.0170], 13); // Cannes
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

    // Get CSS variable values from :root
    function getCSSVar(name) {
        return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    }

    // Function to create a vendor icon using color palette
    function createVendorIcon(logoUrl, size = 48) {
        // Get palette colors
        const gold = getCSSVar('--color-primary') || '#FF5E5B';
        const dark = getCSSVar('--color-dark') || '#2E2E2E';
        const white = getCSSVar('--color-light') || '#FAF9F8';

        const svg = `
        <svg width="${size}" height="${size*1.25}" viewBox="0 0 48 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <clipPath id="logoClip">
            <circle cx="24" cy="23" r="13"/>
            </clipPath>
        </defs>
        <g>
            <path d="M24 0C11 0 0 10.5 0 23.5C0 39.5 24 60 24 60C24 60 48 39.5 48 23.5C48 10.5 37 0 24 0Z" fill="${gold}" stroke="${dark}" stroke-width="2"/>
            <circle cx="24" cy="23" r="15" fill="${white}" stroke="${dark}" stroke-width="2"/>
            <image href="${logoUrl}" x="11" y="10" width="26" height="26" clip-path="url(#logoClip)" preserveAspectRatio="xMidYMid slice"/>
        </g>
        </svg>
        `;
        return L.divIcon({
            className: '',
            html: svg,
            iconSize: [size, size*1.25],
            iconAnchor: [size/2, size*1.25],
            popupAnchor: [0, -size*1.1]
        });
    }
        var vendors = [
            { name: "The House of Amazon at Amazon Port", lat: 43.55110218455641, lng: 7.015049886167262, type: "Event" },
            { name: "MediaLink Beach", lat: 43.55092767110725, lng: 7.018601156770044, type: "Vendor" },
            { name: "ADWEEK House", lat: 43.551201464243, lng: 7.019769600453224, type: "Vendor" },
            { name: "Campaign HOUSE", lat: 43.54857169448848, lng: 7.0120379560461865, type: "Vendor" },
            { name: "FreeWheel Beach", lat: 43.550297014080535, lng: 7.022690394680652, type: "Vendor" },
            { name: "SPORT BEACH", lat: 43.54955539195014, lng: 7.026315380624815, type: "Vendor" },
            { name: "Quintal of Brazilian", lat: 43.548295252508304, lng: 7.03007929468061, type: "Vendor" },
            { name: "World Woman Foundation", lat: 43.55220193370154, lng: 7.016503067131006, type: "Vendor" },
            { name: "LWS at Cannes", lat: 43.55033366971327, lng: 7.028704567692792, type: "Vendor" },
            { name: "Kantar", lat: 43.55218207949816, lng: 7.020349167692896, type: "Vendor" },
            { name: "The Wall Street Journal", lat: 43.54921501236062, lng: 7.028023296528102, type: "Vendor" },
            { name: "Ad Age", lat: 43.54921501236062, lng: 7.028023296528102, type: "Vendor" },
            { name: "Pinterest", lat: 43.54899903666016, lng: 7.027514930343928, type: "Vendor" },
            { name: "RTL Beach", lat: 43.55009245044343, lng: 7.024723515002513, type: "Vendor" },
            { name: "GWI at Cannes Lions", lat: 43.54977471946039, lng: 7.027268911869482, type: "Vendor" },
            { name: "GWI Spark Stadium", lat: 43.55090568496215, lng: 7.018563011307737, type: "Vendor" },
            { name: "Nielsen", lat: 43.54857650649061, lng: 7.030868404198778, type: "Vendor" },
            { name: "Snowflake", lat: 43.547683991612615, lng: 7.031272453075026, type: "Vendor" },
            { name: "Brands&Culture", lat: 43.560131882240626, lng: 7.029063039843496, type: "Vendor" },
            { name: "InMobi", lat: 43.55326488009182, lng: 7.022883828496712, type: "Vendor" },
            { name: "CULTURE MIX", lat: 43.54933793604799, lng: 7.0268693652834395, type: "Vendor" },
            { name: "72Point", lat: 43.548923416525724, lng: 7.029541919090773, type: "Vendor" },
            { name: "GALA", lat: 43.550199856160674, lng: 7.028389269011532, type: "Vendor" },
            { name: "TikTok", lat: 43.54968142901191, lng: 7.0272206346338715, type: "Vendor" },
            { name: "The Female Quotient", lat: 43.54855294690185, lng: 7.031255163435929, type: "Vendor" },
            { name: "Little Black Book", lat: 43.548923416525724, lng: 7.029541919090773, type: "Vendor" },
            { name: "Captiv8", lat: 43.549782495463724, lng: 7.027590776929952, type: "Vendor" },
            { name: "Basis Technologies", lat: 43.55225808497614, lng: 7.021744845685439, type: "Vendor" },
            { name: "Brand Innovators", lat: 43.54832264755541, lng: 7.029441292271279, type: "Vendor" },
            { name: "Braze", lat: 43.55020526624211, lng: 7.017022927210905, type: "Vendor" },
            { name: "Experian", lat: 43.551200711865135, lng: 7.020778710022148, type: "Vendor" },
            { name: "IAS", lat: 43.55019269419352, lng: 7.015044236448103, type: "Vendor" },
            { name: "Business Insider", lat: 43.55150605951972, lng: 7.019214541990527, type: "Vendor" },
            { name: "VIOOH, JCDecaux and Displayce", lat: 43.55204186126596, lng: 7.015850762874275, type: "Vendor" },
            { name: "3C Ventures", lat: 43.549676415601944, lng: 7.025232179339243, type: "Vendor" },
            { name: "Fortune", lat: 43.55218032809176, lng: 7.021444438295668, type: "Vendor" },
            { name: "Microsoft", lat: 43.548762237087736, lng: 7.0284823248015105, type: "Vendor" },
            { name: "Yahoo", lat: 43.54770732042873, lng: 7.031175893556885, type: "Vendor" },
            { name: "Financial Times", lat: 43.55208728541697, lng: 7.0193342253636, type: "Vendor" },
            { name: "Bloomberg Media", lat: 43.55127496002658, lng: 7.023757213155166, type: "Vendor" },
            { name: "MiQ", lat: 43.549751391444424, lng: 7.027762438295537, type: "Vendor" },
            { name: "Blutui", lat: 43.548923416525724, lng: 7.029541919090773, type: "Vendor" },
            { name: "VaynerX", lat: 43.55230298486027, lng: 7.0162809253635725, type: "Vendor" },
            { name: "Tubi", lat: 43.55097566764265, lng: 7.019013622392396, type: "Vendor" },
            { name: "Meta Beach", lat: 43.550571322144705, lng: 7.019592979501241, type: "Vendor" },
            { name: "Advertising Week powered by PRODU", lat: 43.54847684235262, lng: 7.029703338857325, type: "Vendor" },
            { name: "Monks", lat: 43.551889979950296, lng: 7.017114625363567, type: "Vendor" },
            { name: "Inkwell Beach", lat: 43.54892616517826, lng: 7.027459196528062, type: "Vendor" },
            { name: "IInfluential Beach", lat: 43.54871902259302, lng: 7.028314983034094, type: "Vendor" },
            { name: "Spotify", lat: 43.54981131120654, lng: 7.0256555898620645, type: "Vendor" },
            { name: "Ogury", lat: 43.551515435295876, lng: 7.017813149942138, type: "Vendor" },
            { name: "GumGum", lat: 43.55062838918143, lng: 7.023815967692815, type: "Vendor" },
            { name: "iHeartMedia", lat: 43.551917910107164, lng: 7.016928552351518, type: "Vendor" },
            { name: "LinkedIn", lat: 43.54967754370975, lng: 7.026614823515962, type: "Vendor" },
            { name: "Insights LIghthouse", lat: 43.551045363965876, lng: 7.0201462346007135, type: "Vendor" },
            { name: "MMA", lat: 43.548423848557114, lng: 7.03078916650735, type: "Vendor" },
            { name: "OpenX", lat: 43.55160043825184, lng: 7.01837506769285, type: "Vendor" },
            { name: "Omnicom", lat: 43.55030511025082, lng: 7.019833621106698, type: "Vendor" },
            { name: "The Weather Company", lat: 43.55173994300517, lng: 7.020830368060339, type: "Vendor" },
            { name: "The Washington Post", lat: 43.55173994300517, lng: 7.020830368060339, type: "Vendor" },
            { name: "Criteo", lat: 43.54942726835005, lng: 7.0170193695401775, type: "Vendor" },
            { name: "Human", lat: 43.55107793973495, lng: 7.020766538857428, type: "Vendor" },
            { name: "Bain", lat: 43.551171499429536, lng: 7.02489835776828, type: "Vendor" },
            { name: "Transmission", lat: 43.5484751899793, lng: 7.03061334809453, type: "Vendor" },
            { name: "BCG - Boston Consulting Group", lat: 43.549159923156, lng: 7.027850791129357, type: "Vendor" },
            { name: "Canva", lat: 43.54843963720271, lng: 7.030858269053223, type: "Vendor", logo: "images/Canva_logo.jpg" },
            { name: "Havas", lat: 43.55049205803851, lng: 7.0249823076127855, type: "Vendor" },
            { name: "Infillion", lat: 43.551171499429536, lng: 7.02489835776828, type: "Vendor" },
            { name: "Monks", lat: 43.551873207216204, lng: 7.017115796528242, type: "Vendor" },
            { name: "Empower Café", lat: 43.55200685842121, lng: 7.017220154198889, type: "Vendor" },
            { name: "The Room", lat: 43.549411716250766, lng: 7.016933538857386, type: "Vendor" },
            { name: "The Media Trust", lat: 43.55246568444047, lng: 7.015286838857559, type: "Vendor" },
            { name: "The SH Collective", lat: 43.559909496125954, lng: 7.054605304027461, type: "Vendor" },
            { name: "Chase Media Solutions", lat: 43.55094456423911, lng: 7.017919281186798, type: "Vendor" },
            { name: "Taboola", lat: 43.55125081508018, lng: 7.024699354198866, type: "Vendor" },
            { name: "Videoamp", lat: 43.54954164409556, lng: 7.025856625363427, type: "Vendor" },
            { name: "StackAdapt", lat: 43.55097566764265, lng: 7.017940738857496, type: "Vendor" },
            { name: "Chez Verve", lat: 43.55148788376024, lng: 7.022739894680785, type: "Vendor" },
            { name: "Viant", lat: 43.551076467317394, lng: 7.019695623516063, type: "Vendor" },
            { name: "Advertising Association - UK Advertising", lat: 43.551562659395636, lng: 7.0210136407049415, type: "Vendor" },
            { name: "Alkimiads", lat: 43.540513973150354, lng: 7.032561294680153, type: "Vendor" },
            { name: "Givsly", lat: 43.551407566249445, lng: 7.018821956046345, type: "Vendor" },
            { name: "Adform", lat: 43.5512430392663, lng: 7.024667167692819, type: "Vendor" },
            { name: "Spectrum Reach", lat: 43.54996771090391, lng: 7.026551810022072, type: "Vendor" },
            { name: "Pickaxe Foundry", lat: 43.550216022038676, lng: 7.014529252351352, type: "Vendor" },
            { name: "Pantone", lat: 43.550983443491035, lng: 7.018552282472389, type: "Vendor" },
            { name: "VCCP", lat: 43.54913554524819, lng: 7.0286328676927035, type: "Vendor" },
            { name: "Deep Blue Sports + Entertainment", lat: 43.54891431910658, lng: 7.008380063835597, type: "Vendor" },
            { name: "BeReal", lat: 43.550189714343546, lng: 7.016926367692765, type: "Vendor" },
            { name: "Snowflake", lat: 43.54861057527106, lng: 7.011973583034092, type: "Vendor" }
        ];

        // Keep a reference to all markers by vendor name
        var vendorMarkers = {};
        vendors.forEach(function(v) {
            var normalIcon = createVendorIcon(v.logo || 'images/vendor-logos/default.png', 48);
            var largeIcon = createVendorIcon(v.logo || 'images/vendor-logos/default.png', 64);

            var marker = L.marker([v.lat, v.lng], { icon: normalIcon })
                .addTo(map)
                .bindPopup(`<b>${v.name}</b><br>${v.type}`);

            marker.normalIcon = normalIcon;
            marker.largeIcon = largeIcon;

            marker.on('click', function() {
                // Reset all markers to normal
                Object.values(vendorMarkers).forEach(function(m) {
                    m.setIcon(m.normalIcon);
                });
                // Enlarge this marker
                marker.setIcon(marker.largeIcon);
            });

            // Optional: shrink back when popup closes
            marker.on('popupclose', function() {
                marker.setIcon(marker.normalIcon);
            });

            vendorMarkers[v.name.toLowerCase()] = marker;
        });

        // User location marker, centered on load
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                var lat = position.coords.latitude;
                var lng = position.coords.longitude;

                // Add a marker for the user's location
                L.marker([lat, lng]).addTo(map).bindPopup("You are here").openPopup();

                // Center the map on the user's location
                map.setView([lat, lng], 16);
            }, function() {
                console.log("Unable to retrieve your location.");
            });
        } else {
            console.log("Geolocation is not supported by this browser.");
        }

        

        // Search function
        document.getElementById('vendor-search-btn').addEventListener('click', function() {
            var searchValue = document.getElementById('vendor-search').value.trim().toLowerCase();
            if (!searchValue) return;
            // Find the first vendor whose name includes the search value
            var found = vendors.find(v => v.name.toLowerCase().includes(searchValue));
            if (found) {
                var marker = vendorMarkers[found.name.toLowerCase()];
                map.setView([found.lat, found.lng], 17);
                marker.openPopup();
            } else {
                alert('Vendor not found.');
            }
        });

        // Optional: allow pressing Enter to search
        document.getElementById('vendor-search').addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                document.getElementById('vendor-search-btn').click();
            }
        });

        if ("geolocation" in navigator) {
            navigator.geolocation.watchPosition(function(position) {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                // If marker already exists, move it; otherwise, create it
                if (window.userLocationMarker) {
                    window.userLocationMarker.setLatLng([lat, lng]);
                } else {
                    window.userLocationMarker = L.marker([lat, lng])
                        .addTo(map)
                        .bindPopup("You are here")
                        .openPopup();
                }

                // Optionally, center the map on the user's location the first time
                if (!window.userLocationCentered) {
                    map.setView([lat, lng], 16);
                    window.userLocationCentered = true;
                }
            }, function(error) {
                console.warn("Geolocation error:", error.message);
            }, {
                enableHighAccuracy: true
            });
        } else {
            alert("Geolocation is not supported by your browser.");
        }

        // Example: Plan a route from point A to B
        // var control = L.Routing.control({
        //     waypoints: [
        //         L.latLng(43.55110218455641, 7.015049886167262), // Point A
        //         L.latLng(43.54843963720271, 7.030858269053223)  // Point B
        //     ],
        //     routeWhileDragging: true,
        //     showAlternatives: true,
        //     draggableWaypoints: true,
        //     addWaypoints: true,
        //     // Optionally, use a different routing service:
        //     // router: L.Routing.openrouteservice('YOUR_API_KEY')
        // }).addTo(map);

        // control.on('routesfound', function(e) {
        //     var routes = e.routes;
        //     var summary = routes[0].summary;
        //     alert('Total distance: ' + (summary.totalDistance / 1000).toFixed(2) + ' km, time: ' +
        //         Math.round(summary.totalTime / 60) + ' minutes');
        // });

        let routePoints = [];
        let routingControl = null;

        map.on('click', function(e) {
            if (routePoints.length < 2) {
                routePoints.push(e.latlng);

                // Optionally, add a marker for visual feedback
                L.marker(e.latlng).addTo(map);

                if (routePoints.length === 2) {
                    // Remove previous route if it exists
                    if (routingControl) {
                        map.removeControl(routingControl);
                    }
                    // Add routing control
                    routingControl = L.Routing.control({
                        waypoints: routePoints,
                        routeWhileDragging: false,
                        showAlternatives: false,
                        draggableWaypoints: true
                    }).addTo(map);

                    // Show travel time in an alert or UI
                    routingControl.on('routesfound', function(e) {
                        var summary = e.routes[0].summary;
                        alert(
                            'Distance: ' + (summary.totalDistance / 1000).toFixed(2) + ' km\n' +
                            'Estimated time: ' + Math.round(summary.totalTime / 60) + ' min'
                        );
                    });
                }
            } else {
                // Reset if user clicks a third time
                routePoints = [];
                if (routingControl) {
                    map.removeControl(routingControl);
                    routingControl = null;
                }
                map.eachLayer(function(layer) {
                    if (layer instanceof L.Marker && !layer._popup) {
                        map.removeLayer(layer);
                    }
                });
            }
        });

        function getUserLocation(callback) {
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(function(position) {
                    callback([position.coords.latitude, position.coords.longitude]);
                }, function(error) {
                    alert("Could not get your location.");
                });
            } else {
                alert("Geolocation is not supported by your browser.");
            }
        }

        vendors.forEach(function(v, idx) {
            var icon = createVendorIcon(v.logo || 'images/vendor-logos/default.png', 48);
            var marker = L.marker([v.lat, v.lng], { icon: icon })
                .addTo(map)
                .bindPopup(
                    `<b>${v.name}</b><br>${v.type}<br>
                    <button id="route-btn-${idx}" data-lat="${v.lat}" data-lng="${v.lng}">Get Directions</button>`
                );

            marker.on('popupopen', function() {
                // Wait for the popup to be rendered
                setTimeout(function() {
                    const btn = document.getElementById(`route-btn-${idx}`);
                    if (btn) {
                        btn.onclick = function() {
                            getUserLocation(function(userLatLng) {
                                if (routingControl) {
                                    map.removeControl(routingControl);
                                }
                                routingControl = L.Routing.control({
                                    waypoints: [
                                        L.latLng(userLatLng[0], userLatLng[1]),
                                        L.latLng(v.lat, v.lng)
                                    ],
                                    routeWhileDragging: false,
                                    showAlternatives: false,
                                    draggableWaypoints: false
                                }).addTo(map);

                                routingControl.on('routesfound', function(e) {
                                    var summary = e.routes[0].summary;
                                    alert(
                                        'Distance: ' + (summary.totalDistance / 1000).toFixed(2) + ' km\n' +
                                        'Estimated time: ' + Math.round(summary.totalTime / 60) + ' min'
                                    );
                                });
                            });
                        };
                    }
                }, 100); // Delay ensures the popup DOM is ready
            });
        });
    }
});