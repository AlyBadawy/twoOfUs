package com.twoofus.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Forwards all client-side routes to index.html so React Router can handle them.
 * The regex excludes paths with file extensions (CSS, JS, images, etc.) so static
 * assets are still served directly. Spring MVC's @RestController mappings for
 * /api/** take precedence over this catch-all.
 */
@Controller
public class SpaController {

    @RequestMapping(value = {"/{path:^(?!api$)[^\\.]*}", "/{path:^(?!api$)[^\\.]*}/**"})
    public String forward() {
        return "forward:/index.html";
    }
}
