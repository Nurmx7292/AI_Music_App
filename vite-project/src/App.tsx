import { Routes, Route } from 'react-router-dom'
import './App.css'
import { Favorite } from './pages/Favorite'
import { Trending } from './pages/Trending'
import { Player } from './pages/Player'
import { Feed } from './pages/Feed'
import { Library } from './pages/Library'
import Sidebar from './components/sidebar/Sidebar'
function App() {

  return (
    <div className='main-body'>
      <Sidebar/>
      <Routes>
        <Route path='/' element={<Library/>}/>
        <Route path='/favorite' element={<Favorite/>}/>
        <Route path='/feed' element={<Feed/>}/>
        <Route path='/player' element={<Player/>}/>
        <Route path='/rending' element={<Trending/>}/>
      </Routes>
    </div>
  )
}

export default App
