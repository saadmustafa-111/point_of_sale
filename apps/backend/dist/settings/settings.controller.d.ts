import { SettingsService } from './settings.service';
declare class UpsertSettingDto {
    value: string;
}
declare class SettingEntryDto {
    key: string;
    value: string;
}
declare class BulkUpsertDto {
    entries: SettingEntryDto[];
}
export declare class SettingsController {
    private service;
    constructor(service: SettingsService);
    all(): Promise<{
        id: string;
        updatedAt: Date;
        key: string;
        value: string;
    }[]>;
    one(key: string): Promise<{
        id: string;
        updatedAt: Date;
        key: string;
        value: string;
    }>;
    set(key: string, dto: UpsertSettingDto): Promise<{
        id: string;
        updatedAt: Date;
        key: string;
        value: string;
    }>;
    bulk(dto: BulkUpsertDto): Promise<{
        id: string;
        updatedAt: Date;
        key: string;
        value: string;
    }[]>;
}
export {};
