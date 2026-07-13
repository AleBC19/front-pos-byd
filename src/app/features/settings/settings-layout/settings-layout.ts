import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-settings-layout',
  templateUrl: './settings-layout.html',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
})
export class SettingsLayout {}
