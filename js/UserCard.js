export default class UserCard {

    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }

    render(user) {
        this.container.innerHTML = `
            <div class="user-card">
                <img src="${user.picture.large}" alt="avatar">
                <h2>${user.name.first} ${user.name.last}</h2>
            </div>
        `;
    }

}