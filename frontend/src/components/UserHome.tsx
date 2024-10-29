//requires a logout button for our own testing purposes
//may require other components like a modularized component with media player
import VideoList from "./Videolist";

const UserHome = () => {
    return (
        <div id="home-page">
            <h1>Hello!</h1>
            <VideoList />
        </div>
    )
}

export default UserHome;