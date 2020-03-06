import React, { useState } from 'react';
import styled from 'styled-components';
import Main from './views/main/Main';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
  Link
} from "react-router-dom";
import { WebApi } from './web/restful';
import { MainInfoReturn } from './data/misc';

function App() {
  const [mainInfo, setMainInfo] = useState<MainInfoReturn | null>(null);
  if(!mainInfo) WebApi.getMainInfo().then(setMainInfo);

  return (
    <Router>
      <Switch>
        <Route path='/' exact>
          {mainInfo && <Redirect to={'/' + mainInfo.defaultRoom} />}
        </Route>
        <Route path='/:room' exact>
          <Main/>
        </Route>
      </Switch>
    </Router>
  )
}

export default App;
