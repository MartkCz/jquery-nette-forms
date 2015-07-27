# Client-side pro Nette forms

## Instalace

```html
<script src="{$basePath}/js/jquery.js"></script>
<script src="{$basePath}/js/netteForms.js"></script>
<script src="{$basePath}/js/jquery.nette.forms.js"></script>
<script>
    $.form.init();
</script>
```

## Konfigurace

```html
    $.form.liveValidationUrl = {link validate!}; // Optional - Globální nastavení pro live validaci
    $.form.useLabels = true; // Výchozí true - Při hodnotě true a při renderu chyb u formuláře bere label pole a přidá k chybové zprávě
```

Pro dynamicky přidané formuláře můžeme přiřadit validaci za pomocí:

```html
    $.form.refresh();
```

## Nastavení formuláře přes data atributy

### data-novalidate

Vynechá validaci celého formuláře.

```html
    <form n:name="name" data-novalidate>
```

### data-novalidatelive

Vynechá live validaci celého formuláře.

```html
    <form n:name="name" data-novalidatelive>
```

### data-error-container

Nastaví vlastní container pro chybové hlášky

```html
    <div id="myContainer"></div>
    
    <form n:name="name" data-error-container="#myContainer">
```

### data-error-type

Nastaví container pro jednu chybovou hlášku.

```html
    <form n:name="name" data-error-type="strong class='input-error'">
```

Vygeneruje:

```html
    <div class="form-error-container">
        <strong class="input-error">Tato položka je povinná.</strong>
    </div>
```

### data-renderer 

Nastaví renderer.

```html
    <form n:name="name" data-renderer="myRenderer">
```

### data-nolabel

Vynechá chybovou hlášku s label.

```html
    <form n:name="name" data-nolabel>
```

### data-errors-at

```html
    <form n:name="name" data-errors-at="form">
```

Nastaví vykreslovaní chyb u formuláře místo u inputů.

## Nastavení pole přes data atributy

### data-validatelive-url

Na danou url adresu se pošlou údaje k vyhodnocení.

```html
    <input n:name="name" data-validatelive-url="{link validateName!}">
```

### data-novalidatelive

Live validace se u tohoto pole neprovede

```html
    <input n:name="name" data-novalidatelive>
```

### data-error-container

Nastaví vlastní container pro chybové hlášky

```html
    <input n:name="name" data-error-container="#customContainer">
    
    <div id="customContainer"></div>
```

### data-error-type

Nastaví container pro jednu chybovou hlášku.

```html
    <input n:name="name" data-error-type="strong class='input-error'">
```

Vygeneruje:

```html
    <div class="form-error-container">
        <strong class="input-error">Tato položka je povinná.</strong>
    </div>
```

### data-novalidate

Pole bude přeskočeno při validaci.

```html
    <input n:name="name" data-novalidate>
```

### data-label

Nastaví label pro chybovou hlášku.

```html
    <input n:name="name" data-label="Uživatelské jméno">
```

### data-nolabel

Vynechá chybovou hlášku s label.

```html
    <input n:name="name" data-nolabel>
```

## Nastavení odesílacích tlačítek přes data atributy

### data-novalidate

Vynechá validaci formuláře po kliknutí na dané tlačítko.

```html
    <input n:name="back" data-novalidate>
```

## Vlastní renderery

```javascript

$.form.addRenderer('render', {
    /**
     * Error at control
     *
     * @param {string} message
     * @param {SingleControl} ctrl
     */
    controlError: function (message, ctrl) {
        // Odstranění chyby u pole
    },
    /**
     * Errors at form
     *
     * @param {string} message
     * @param {SingleControl} ctrl
     */
    formError: function (message, ctrl) {
        // Přidání chyby u formuláře
    },
    /**
     * Base method for adding error message
     *
     * @param {string} message
     * @param $container
     * @param {SingleControl} ctrl
     * @param {string} type
     */
    addError: function (message, $container, ctrl, type) {
        // Přidání chyby
    },
    /**
     * Base method for removing error message
     *
     * @param $container
     * @param {SingleControl} ctrl
     */
    removeCustomError: function ($container, ctrl) {
        // Odstranění chyby 
    },
    /**
     * Method which removes error message at control
     *
     * @param {SingleControl} ctrl
     */
    removeError: function (ctrl) {
        // Odstranění chyby u pole
    },
    /**
     * Method which removes error message at form
     *
     * @param {SingleControl} ctrl
     */
    removeFormError: function (ctrl) {
        // Odstranění chyby u formuláře
    }
});

```