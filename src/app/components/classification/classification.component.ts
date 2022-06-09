import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';

declare let ml5: any;

@Component({
  selector: 'app-classification',
  templateUrl: './classification.component.html',
  styleUrls: ['./classification.component.scss'],
})
export class ClassificationComponent implements AfterViewInit {
  private classifier: any;
  public label: any;
  public confidence: any;
  @ViewChild('video') private video!: ElementRef;

  ngAfterViewInit() {
    console.log(webkitURL);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
        this.video.nativeElement.srcObject = stream;
        this.video.nativeElement.play();
      });
    }

    this.classifier = ml5.imageClassifier(
      'assets/my-model/model.json',
      this.video.nativeElement,
      () => {
        this.classifier.classify((e: any, r: any) => {
          this.gotResults(e, r);
        });
      }
    );
  }

  gotResults(err: any, results: any) {
    if (err) {
      console.log(err);
    } else {
      this.label = results[0].label;
      this.confidence = results[0].confidence;
      this.classifier.classify((e: any, r: any) => {
        this.gotResults(e, r);
      });
    }
  }
}
