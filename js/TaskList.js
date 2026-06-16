export default class TaskList {

    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }

    render(html) {
        this.container.innerHTML = html;
    }

}