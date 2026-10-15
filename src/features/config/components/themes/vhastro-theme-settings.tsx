import { useFormContext, useWatch } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { AssetUploadField } from "@/features/config/components/asset-upload-field";
import { Field } from "@/features/config/components/site-settings-fields";
import type { SystemConfig } from "@/features/config/config.schema";
import { isVhastro } from "@/lib/theme-mode";
import { m } from "@/paraglide/messages";

const HEX_COLOR_REGEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/**
 * vhAstro 主色 / 字体色实时预览
 * 用局部变量覆写主题令牌，预览卡片、按钮、链接的实际观感。
 */
function VhastroPrimaryPreview() {
  const { control } = useFormContext<SystemConfig>();
  const currentColor = useWatch({
    control,
    name: "site.theme.vhastro.primaryColor",
  });
  const currentFont = useWatch({
    control,
    name: "site.theme.vhastro.fontColor",
  });

  const primary =
    typeof currentColor === "string" && HEX_COLOR_REGEX.test(currentColor)
      ? currentColor
      : "#01c4b6";
  const font =
    typeof currentFont === "string" && HEX_COLOR_REGEX.test(currentFont)
      ? currentFont
      : "#34495e";

  return (
    <div
      className="rounded-2xl border border-border/40 p-4 md:col-span-2"
      style={
        {
          "--vhastro-theme": primary,
          "--vhastro-primary": primary,
          "--vhastro-font-color": font,
        } as React.CSSProperties
      }
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-foreground">
            {m.settings_site_primary_preview_title()}
          </p>
          <p className="text-xs text-muted-foreground">
            {m.settings_site_vhastro_preview_desc({ color: primary })}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div
            className="h-10 w-10 rounded-xl border border-black/10 shadow-sm"
            style={{ backgroundColor: "var(--vhastro-theme)" }}
          />
          <div
            className="h-10 w-10 rounded-xl border border-black/10 shadow-sm"
            style={{ backgroundColor: "var(--vhastro-font-color)" }}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div className="vhastro-aside-item items-start border border-black/5 p-4">
          <div className="flex w-full items-center justify-between">
            <span className="vhastro-cat-gradient text-sm">Code</span>
            <span className="text-xs vhastro-text-50">2026-10-14</span>
          </div>
          <p className="text-base font-semibold vhastro-text-90">
            {m.settings_site_primary_preview_card_title()}
          </p>
          <p className="line-clamp-2 text-sm vhastro-text-75">
            {m.settings_site_vhastro_preview_card_desc()}
          </p>
        </div>

        <button
          type="button"
          className="vhastro-btn-primary h-11 rounded-[0.5rem] px-4 text-sm font-semibold active:scale-[0.98]"
          style={{ backgroundColor: primary, color: "#ffffff" }}
        >
          {m.settings_site_primary_preview_btn_primary()}
        </button>

        <button
          type="button"
          className="vhastro-btn-regular h-11 rounded-[0.5rem] px-4 text-sm font-medium active:scale-[0.98]"
        >
          {m.settings_site_primary_preview_btn_tinted()}
        </button>
      </div>
    </div>
  );
}

function ColorField({
  name,
  label,
  hint,
  fallback,
  error,
}: {
  name:
    | "site.theme.vhastro.primaryColor"
    | "site.theme.vhastro.fontColor";
  label: string;
  hint: string;
  fallback: string;
  error?: string;
}) {
  const { register } = useFormContext<SystemConfig>();

  return (
    <Field label={label} hint={hint} error={error}>
      <div className="flex items-center gap-3">
        <input
          type="color"
          aria-label={label}
          defaultValue={fallback}
          className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-border/50 bg-transparent p-1"
          {...register(name)}
        />
        <Input placeholder={fallback} {...register(name)} />
      </div>
    </Field>
  );
}

/**
 * vhAstro 主题专属设置
 * 首屏大图 / 内页横幅 / 头像 / 主色 / 字体色 / 侧栏宽度 / 圆角 / 主体宽度
 */
export function VhastroThemeSettings() {
  const {
    register,
    formState: { errors },
  } = useFormContext<SystemConfig>();

  const themeErrors = errors.site?.theme?.vhastro;

  const homeBgField = (
    <div className="sm:col-span-2">
      <AssetUploadField
        name="site.theme.vhastro.homeBg"
        assetPath="themes/vhastro/home-bg.webp"
        accept=".png,.webp,.jpg,.jpeg"
        label={m.settings_site_field_home_image()}
        hint={m.settings_site_field_home_image_hint()}
        placeholder="/images/asset/themes/vhastro/home-bg.webp or https://picsum.photos/1600/900"
        error={themeErrors?.homeBg?.message}
      />
    </div>
  );

  const pageBgField = (
    <div className="sm:col-span-2">
      <AssetUploadField
        name="site.theme.vhastro.pageBg"
        assetPath="themes/vhastro/page-bg.webp"
        accept=".png,.webp,.jpg,.jpeg"
        label={m.settings_site_field_page_image()}
        hint={m.settings_site_field_page_image_hint()}
        placeholder="/images/asset/themes/vhastro/page-bg.webp or https://picsum.photos/1600/900"
        error={themeErrors?.pageBg?.message}
      />
    </div>
  );

  const avatarField = (
    <AssetUploadField
      name="site.theme.vhastro.avatar"
      assetPath="themes/vhastro/avatar.png"
      accept=".png,.webp,.jpg,.jpeg"
      readOnly
      label={m.settings_site_field_avatar()}
      error={themeErrors?.avatar?.message}
    />
  );

  const primaryColorField = (
    <>
      <ColorField
        name="site.theme.vhastro.primaryColor"
        label={m.settings_site_field_primary_color()}
        hint={m.settings_site_field_primary_color_hint()}
        fallback="#01c4b6"
        error={themeErrors?.primaryColor?.message}
      />
      <ColorField
        name="site.theme.vhastro.fontColor"
        label={m.settings_site_field_font_color()}
        hint={m.settings_site_field_font_color_hint()}
        fallback="#34495e"
        error={themeErrors?.fontColor?.message}
      />
      <VhastroPrimaryPreview />
    </>
  );

  const layoutFields = (
    <>
      <Field
        label={m.settings_site_field_aside_width()}
        hint={m.settings_site_field_aside_width_hint()}
        error={themeErrors?.asideWidth?.message}
      >
        <Input placeholder="318px" {...register("site.theme.vhastro.asideWidth")} />
      </Field>

      <Field
        label={m.settings_site_field_radius()}
        hint={m.settings_site_field_radius_hint()}
        error={themeErrors?.radius?.message}
      >
        <Input placeholder="1rem" {...register("site.theme.vhastro.radius")} />
      </Field>

      <Field
        label={m.settings_site_field_max_width()}
        hint={m.settings_site_field_max_width_hint()}
        error={themeErrors?.maxWidth?.message}
      >
        <Input placeholder="1458px" {...register("site.theme.vhastro.maxWidth")} />
      </Field>
    </>
  );

  if (isVhastro) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {homeBgField}
        {pageBgField}
        {avatarField}
        {primaryColorField}
        {layoutFields}
      </div>
    );
  }

  return (
    <>
      {homeBgField}
      {pageBgField}
      {avatarField}
      {primaryColorField}
      {layoutFields}
    </>
  );
}
