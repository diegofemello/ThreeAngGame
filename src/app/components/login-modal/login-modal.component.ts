import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-login-modal',
  templateUrl: './login-modal.component.html',
  styleUrls: ['./login-modal.component.scss']
})
export class LoginModalComponent implements OnInit {
  @Input() name?: string;
  username!: string;

  constructor(public activeModal: NgbActiveModal) {}

  ngOnInit(): void {
  }

  submit(){
    this.activeModal.close(this.username);
  }

}
