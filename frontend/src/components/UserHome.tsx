//requires a logout button for our own testing purposes
//may require other components like a modularized component with media player
import VideoList from "./VideoList";

const UserHome = () => {
    return (
        <div id="home-page" className='m-3 text-center'>
            <h1 className='text-4xl'>Hello!</h1>
            <VideoList />
        </div>
    )
}

export default UserHome;