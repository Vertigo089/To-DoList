export default class UserApi {

    static async getUser() {

        const response =
            await fetch('https://randomuser.me/api/');

        const data =
            await response.json();

        return data.results[0];
    }
}