import Home from './pages/Home';
import IdentifyPlant from './pages/IdentifyPlant';
import MyPlants from './pages/MyPlants';
import PlantProfile from './pages/PlantProfile';
import Calendar from './pages/Calendar';
import Settings from './pages/Settings';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "IdentifyPlant": IdentifyPlant,
    "MyPlants": MyPlants,
    "PlantProfile": PlantProfile,
    "Calendar": Calendar,
    "Settings": Settings,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};