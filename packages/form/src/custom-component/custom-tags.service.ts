/**
 * @source https://github.com/formio/angular/blob/master/projects/angular-formio/src/custom-component/custom-tags.service.ts
 */
import { Injectable } from '@angular/core'

@Injectable()
export class CustomTagsService {
    tags: string[] = []

    addCustomTag(tag: string) {
        this.tags.push(tag)
    }
}
