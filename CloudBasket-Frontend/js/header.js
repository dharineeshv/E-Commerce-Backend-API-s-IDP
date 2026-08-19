export function loadHeader() {

    return `

<header class="dashboard-header">

    <div class="header-left">

        <button id="menu-toggle">

            â˜°

        </button>

        <div class="logo-container">

            <img
                src="./assets/logo.png"
                alt="CloudBasket Logo"
                class="logo"
            />

            <div class="logo-text">

                <h2>CloudBasket</h2>

                <span>Enterprise Admin</span>

            </div>

        </div>

    </div>

    <div class="header-right">

        <button
            id="notification-btn"
            class="notification-btn"
        >

            ðŸ””

            <span class="notification-dot"></span>

        </button>

        <div class="admin-profile">

            <div class="profile-avatar">

                D

            </div>

            <div class="profile-info">

                <h4 id="admin-name">

                    Dharineesh V

                </h4>

                <span>

                    Super Admin

                </span>

            </div>

            <span class="dropdown-arrow">

                â–¼

            </span>

        </div>

    </div>

</header>

`;

}
