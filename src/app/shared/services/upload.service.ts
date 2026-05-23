import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@env/environment';
import { ImageVariant, VideoVariant } from '@shared/interfaces/image-variant.interface';
import { UploadFolder } from '@shared/interfaces/upload.interface';
import { resolveUrl, resolveVariant, resolveVideoVariant } from '@shared/utilities/image-url.utils';

@Injectable({ providedIn: 'root' })
export class UploadService {
  private readonly _http: HttpClient = inject(HttpClient);

  uploadImages(folder: UploadFolder, files: File[]): Observable<ImageVariant[]> {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    return this._http
      .post<{ statusCode: number; data: { images: ImageVariant[] } }>(
        `${environment.apiUrl}/uploads/${folder}`,
        formData,
      )
      .pipe(map((r) => r.data.images.map(resolveVariant)));
  }

  uploadVideo(file: File): Observable<VideoVariant> {
    const formData = new FormData();
    formData.append('file', file);
    return this._http
      .post<{ statusCode: number; data: { video: VideoVariant } }>(
        `${environment.apiUrl}/uploads/organizational/videos`,
        formData,
      )
      .pipe(map((r) => resolveVideoVariant(r.data.video)));
  }

  uploadDocument(folder: UploadFolder, file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this._http
      .post<{ statusCode: number; data: { url: string } }>(
        `${environment.apiUrl}/uploads/${folder}`,
        formData,
      )
      .pipe(map((r) => resolveUrl(r.data.url)));
  }
}
