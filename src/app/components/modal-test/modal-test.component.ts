import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-modal-test',
  templateUrl: './modal-test.component.html',
  styleUrls: ['./modal-test.component.scss']
})
export class ModalTestComponent implements OnInit {
  @Input() name?: string;

  constructor(public activeModal: NgbActiveModal) {}

  ngOnInit(): void {
  }

}
