import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from '../sidebar/sidebar';
import { Topbar } from '../topbar/topbar';

// Shell principal: sidebar fijo a la izquierda, topbar arriba y
// el contenido de cada vista en el router-outlet.
@Component({
  selector: 'app-main-layout',
  templateUrl: './main-layout.html',
  imports: [RouterOutlet, Sidebar, Topbar],
})
export class MainLayout {}
